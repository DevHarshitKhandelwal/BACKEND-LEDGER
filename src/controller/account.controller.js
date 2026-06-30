const accountModel = require("../models/account.model");

async function createAccountController(req,res){
    const user = req.user

    const account = await accountModel.create({
        user:user._id
    })
    res.status(201).json({
        account
    })
}


async function getAccountBalanceController(req,res){
    const {accountId}=req.params;
    const account = await accountModel.findOne({_id:accountId, user:req.user._id})
    if(!account){
        return res.status(404).json({
            message:"Account not found"
        })
    }
    const balance = await account.getBalance();

res.status(200).json({
    accountId: account._id,
    balance
});
}

async function getUserAccountsController(req, res) {
    try {
        const accounts = await accountModel.find({ user: req.user._id });
        const accountsWithBalance = await Promise.all(accounts.map(async (acc) => {
            const balance = await acc.getBalance();
            return {
                _id: acc._id,
                user: acc.user,
                systemUser: acc.systemUser,
                status: acc.status,
                currency: acc.currency,
                balance: balance,
                createdAt: acc.createdAt
            };
        }));
        res.status(200).json({ accounts: accountsWithBalance });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

module.exports ={
    createAccountController,
    getAccountBalanceController,
    getUserAccountsController
}