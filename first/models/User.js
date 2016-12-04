/**
 * 用户表定义
 *
 * @Author bian
 * @CreateDate 2016.11.28
 */
module.exports = (sequelize,DataTypes) => {
    return sequelize.define("User",{
        account : {
            type : DataTypes.STRING,
            unique : true
        },
        password : {
            type : DataTypes.STRING
        }
    })
};