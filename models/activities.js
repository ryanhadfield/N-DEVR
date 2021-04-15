module.exports = (sequelize, DataTypes)=>{
const Activities = sequelize.define('Activities', {
    activity_type: {
        type: DataTypes.STRING,
    },
    activity_segments: {
        type: DataTypes.STRING,
        allowNull: false
    },
    total_distance: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    total_elevationGain: {
        type: DataTypes.INTEGER,
    },
    total_elevationLoss: {
        type: DataTypes.INTEGER,
    },
    activity_name: {
        type: DataTypes.STRING,
    },
    activity_desc: {
        type: DataTypes.STRING,
    },
    activity_date: {
        type: DataTypes.DATE,
    },
    activity_time: {
        type: DataTypes.TIME,
    },
    activity_gear: {
        type: DataTypes.STRING,
    },
    activity_meeting_location: {
        type: DataTypes.STRING,
    },
    activity_participants: {
        type:DataTypes.STRING,
    }
},
{
    freezeTableName:true,
    timestamps: false,

}
);
Activities.associate = (models) => {
    // We're saying that a Activity should belong to an User
    // A Activity can't be created without an User due to the foreign key constraint
    Activities.belongsTo(models.Users, {
      foreignKey: {
        allowNull: false,
      },
    });
  };



  return Activities;
};

