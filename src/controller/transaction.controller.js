const transactionModel = require("../models/transaction.model")
const ledgerModel = require("../models/ledger.model")
const emailService = require("../services/email.service")
const userModel = require("../models/user.model.js")
const mongoose = require("mongoose");
const accountModel = require("../models/account.model.js");

/**
 * -Create a new transaction
 * The 10-STEP TRANSACTION FLOE:
 * 1.Validate request
 * 2.Validate idempotency key
 * 3.Check account status
 * 4. Derive sender balance from ledger
 * 5.Create transaction (PENDING)
 * 6.Create DEBIT ledger entry
 * 7. Create CREDIT ledger entry
 * 8. Mark transaction Complete
 * 9. Commit MongoDB session
 * 10. Send email Notification
 */

async function createTransaction(req, res) {

    /**
     * 1.Validate request
     */
    const { fromAccount, toAccount, amount, idempotencyKey } = req.body

    if(!fromAccount || !toAccount || !amount || !idempotencyKey){
        return res.status(400).json({
            message:"FromAccount, toAccount, amount and ideampotencyKey are required"
        })
    }
    const fromUserAccount = await accountModel.findOne({
        _id:fromAccount,

    })
    const toUserAccount=await accountModel.findOne({
        _id:toAccount,
    })
    if(!fromUserAccount || !toUserAccount){
        return res.status(400).json({
            message:"Invalid fromAccount or toAccount"
        })
    }

    /**
     * 2.validate ideampotency Key
     */
    const isTransactionAlreadyExists = await transactionModel.findOne({
        ideampotencyKey:ideampotencyKey
    })
    if(!isTransactionAlreadyExists){
        if(isTransactionAlreadyExists.status=="COMPLETED"){
            return res.statud(200).json({
                message:"Transaction already processed",
                transaction:isTransactionAlreadyExists
            })
        }

        if(isTransactionAlreadyExists.status=="PENDING"){
            return res.statud(200).json({
                message:"Transaction is still Processing",
            })
        }

        if(isTransactionAlreadyExists.status=="FAILED"){
            return res.statud(500).json({
                message:"Transaction processing failed, Please try again",
            })
        }

        if(isTransactionAlreadyExists.status=="REVERSED"){
           return res.statud(500).json({
                message:"Transaction was reversed, Please try again",
            })
        }
    }

    /**
     * 3.Check account status
     */
    if(fromUserAccount.status!="ACTIVE" || toUserAccount.status!="ACTIVE"){
        return res.status(400).json({
            message:"Both fromAccount and toAccount must be ACTIVE to process transaction"
        })
    }

    /**
     * 4.Derive sender balance from sender
     */

    const balance = await fromUserAccount.getBalance()
    if(balance<amount){
        res.status(400).json({
            message:`Insufficiant balance. Current balance is #=${balance}, Requested balance is ${amount}`
        })
    }

    /**
     * 5.Create transaction (PENDING)
     */

    const session = await mongoose.startSession()
    session.startTransaction()

    const transaction = await transactionModel.create({
        fromAccount,
        toAccount,
        amount,
        idempotencyKey,
        status:"PENDING"
    },{session})

    const  debitLedgerEntry = await ledgerModel.create({
        account:fromAccount,
        amount:amount,
        transaction:transaction._id,
        type:"DEBIT"
    },{session})
    
    const  creditLedgerEntry = await ledgerModel.create({
        account:toAccount,
        amount:amount,
        transaction:transaction._id,
        type:"CREDIT"
    },{session})

    transaction.status="COMPLETED"
    await transaction.save({session})

    await session.commitTransaction()
    session.endSession()


    /**
     * send email notification
     */

    await emailService
}

async function createInitialFundsTransaction(req, res) {
    const { toAccount, amount, idempotencyKey } = req.body

    if (!toAccount || !amount || !idempotencyKey) {
        return res.status(400).json({
            message: "toAccount, amount and idempotencyKey are required"
        })
    }

    const toUserAccount = await accountModel.findOne({
        _id: toAccount
    })

    if (!toUserAccount) {
        return res.status(400).json({
            message: "Invalid toAccount"
        })
    }

    const fromUserAccount = await accountModel.findOne({
        systemUser: true,
        user: req.user._id
    })

    if (!fromUserAccount) {
        return res.status(400).json({
            message: "System user account not found"
        })
    }

    const session = await mongoose.startSession()
    session.startTransaction()

    const transaction = await transactionModel.create({
    fromAccount: fromUserAccount._id,
    toAccount,
    amount,
    idempotencyKey,
    status: "PENDING"
});

    await ledgerModel.create([{
        account: fromUserAccount._id,
        amount: amount,
        transaction: transaction._id,
        type: "DEBIT"
    }], { session })

    await ledgerModel.create([{
        account: toAccount,
        amount: amount,
        transaction: transaction._id,
        type: "CREDIT"
    }], { session })

    transaction.status = "COMPLETE"
    await transaction.save({ session })

    await session.commitTransaction()
    session.endSession()

    return res.status(201).json({
        message: "Initial funds transaction complete successfully",
        transaction: transaction
    })
}

async function getUserAccountController(req,res){
    const account = await accountModel.find({user:req.user._id});
    res.status(200).json({
        accounts
    })
}

module.exports = {
    getUserAccountController,
    createInitialFundsTransaction
}