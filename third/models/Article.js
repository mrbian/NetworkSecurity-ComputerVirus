/**
 * 文章表
 * Created by bian on 16-12-4.
 */

module.exports = (sequelize,DataTypes) => {
    return sequelize.define("Article",{
        title : {
            type : DataTypes.STRING,
            unique : true
        },
        content : {
            type : DataTypes.TEXT
        }
    })
};