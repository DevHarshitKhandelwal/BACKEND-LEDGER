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

    if (!fromAccount || !toAccount || !amount || !idempotencyKey) {
        return res.status(400).json({
            message: "FromAccount, toAccount, amount and idempotencyKey are required"
        })
    }

    const fromUserAccount = await accountModel.findOne({
        _id: fromAccount,
        user: req.user._id
    })

    const toUserAccount = await accountModel.findOne({
        _id: toAccount,
    })

    if (!fromUserAccount || !toUserAccount) {
        return res.status(400).json({
            message: "Invalid fromAccount or toAccount"
        })
    }

    /**
     * 2.validate idempotency Key
     */
    const isTransactionAlreadyExists = await transactionModel.findOne({
        idempotencyKey: idempotencyKey
    })

    if (isTransactionAlreadyExists) {

        if (isTransactionAlreadyExists.status == "COMPLETED") {
            return res.status(200).json({
                message: "Transaction already processed",
                transaction: isTransactionAlreadyExists
            })
        }

        if (isTransactionAlreadyExists.status == "PENDING") {
            return res.status(200).json({
                message: "Transaction is still Processing",
            })
        }

        if (isTransactionAlreadyExists.status == "FAILED") {
            return res.status(500).json({
                message: "Transaction processing failed, Please try again",
            })
        }

        if (isTransactionAlreadyExists.status == "REVERSED") {
            return res.status(500).json({
                message: "Transaction was reversed, Please try again",
            })
        }
    }

    /**
     * 3.Check account status
     */
    if (fromUserAccount.status != "ACTIVE" || toUserAccount.status != "ACTIVE") {
        return res.status(400).json({
            message: "Both fromAccount and toAccount must be ACTIVE to process transaction"
        })
    }

    /**
     * 4.Derive sender balance from ledger
     */

    const balance = await fromUserAccount.getBalance()

    if (balance < amount) {
        return res.status(400).json({
            message: `Insufficient balance. Current balance is ${balance}, Requested balance is ${amount}`
        })
    }

    let transaction;
    let session;

    try {

        /**
         * 5.Create transaction (PENDING)
         */

        session = await mongoose.startSession()
        session.startTransaction()

        transaction = (await transactionModel.create([{
            fromAccount,
            toAccount,
            amount,
            idempotencyKey,
            status: "PENDING"
        }], { session }))[0]

        await ledgerModel.create([{
            account: fromAccount,
            amount: amount,
            transaction: transaction._id,
            type: "DEBIT"
        }], { session })

        await new Promise(resolve => setTimeout(resolve, 15 * 1000))

        await ledgerModel.create([{
            account: toAccount,
            amount: amount,
            transaction: transaction._id,
            type: "CREDIT"
        }], { session })

        await transactionModel.findByIdAndUpdate(
            transaction._id,
            { status: "COMPLETED" },
            { session }
        )

        await session.commitTransaction()
        session.endSession()

    } catch (error) {

        if (session) {
            await session.abortTransaction()
            session.endSession()
        }

        return res.status(400).json({
            message: "Transaction is Pending due to some issue, please try after some time"
        })
    }

    /**
     * send email notification
     */

    await emailService.sendTransactionEmail(
        req.user.email,
        req.user.name,
        amount,
        toUserAccount
    )

    res.status(201).json({
        message: "Transaction completed successfully",
        transaction: transaction
    })

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

    const transaction = (await transactionModel.create([{
        fromAccount: fromUserAccount._id,
        toAccount,
        amount,
        idempotencyKey,
        status: "PENDING"
    }], { session }))[0]

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

    transaction.status = "COMPLETED"
    await transaction.save({ session })

    await session.commitTransaction()
    session.endSession()

    return res.status(201).json({
        message: "Initial funds transaction complete successfully",
        transaction: transaction
    })
}

async function getUserAccountController(req, res) {
    const accounts = await accountModel.find({ user: req.user._id });

    res.status(200).json({
        accounts
    })
}

module.exports = {
    getUserAccountController,
    createInitialFundsTransaction,
    createTransaction
}