module.exports = (sequelize, Sequelize) => {
  const Branding = sequelize.define('branding', {
    id: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    merchant_id: {
      type: Sequelize.INTEGER,
      allowNull: false,
      unique: true
    },
    logo_url: {
      type: Sequelize.STRING
    },
    primary_color: {
      type: Sequelize.STRING,
      defaultValue: '#6366F1' // Default primary color (indigo-500)
    },
    accent_color: {
      type: Sequelize.STRING,
      defaultValue: '#4F46E5' // Default accent color (indigo-600)
    },
    background_color: {
      type: Sequelize.STRING,
      defaultValue: '#F9FAFB' // Default background color (gray-50)
    },
    text_color: {
      type: Sequelize.STRING,
      defaultValue: '#111827' // Default text color (gray-900)
    },
    button_text_color: {
      type: Sequelize.STRING,
      defaultValue: '#FFFFFF' // Default button text color (white)
    },
    font_family: {
      type: Sequelize.STRING,
      defaultValue: 'Inter, system-ui, sans-serif'
    },
    border_radius: {
      type: Sequelize.STRING,
      defaultValue: '0.5rem' // Default border radius
    },
    show_powered_by: {
      type: Sequelize.BOOLEAN,
      defaultValue: true
    }
  });
  
  return Branding;
};