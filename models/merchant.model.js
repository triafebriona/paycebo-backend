module.exports = (sequelize, Sequelize) => {
  const Merchant = sequelize.define('merchant', {
    id: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: Sequelize.STRING,
      allowNull: false
    },
    email: {
      type: Sequelize.STRING,
      allowNull: false,
      unique: true
    },
    password_hash: {
      type: Sequelize.STRING,
      allowNull: false
    },
    api_key: {
      type: Sequelize.STRING,
      unique: true
    }
  }, {
    timestamps: true,           
    underscored: true,          
    createdAt: 'created_at',     
    updatedAt: 'updated_at'     
  });
  
  return Merchant;
};