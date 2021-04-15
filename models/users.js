module.exports = (sequelize, DataTypes)=>{
    const Users = sequelize.define('Users', {
    user_name: {
        type: DataTypes.STRING,
    },
    user_strava_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    user_first: {
        type: DataTypes.STRING,
    },
    user_last: {
        type: DataTypes.STRING,
    },
    user_photo: {
        type: DataTypes.STRING,
    },
    access_token: {
        type: DataTypes.STRING,
    },
    user_city: {
        type: DataTypes.STRING,
    },
    user_state: {
        type: DataTypes.STRING,
    }
},
{timestamps: false}
);

Users.associate = (models) => {
    // Associating Users with activities
    // When an Users is deleted, also delete any associated Posts
    Users.hasMany(models.Activities, {
      onDelete: 'cascade',
    });
  };


return Users;
};



