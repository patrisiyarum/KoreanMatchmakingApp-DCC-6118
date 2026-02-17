import { pool } from '../config/connectDB.js'; //TOWNSHEND: this was formally connected to sequelize...
//but the methods were using .execute method, so I changed the import to the pool object
import db from '../models/index.js';
//TOWNSHEND: getAllUsers may be the best way to sort users on a page since all data on a UserAccount is attached to the user
// I can explore this more
let getAllUsers = async (req, res) => {
    const [rows, fields] = await pool.execute(`SELECT * FROM UserAccount`);
    return res.status(200).json({
        message: 'ok',
        data: rows
    })
}

let createNewUser = async (req, res) => { //POST function
    let { firstName, lastName, email, address } = req.body;
    if (!firstName || !lastName || !email || !address) {
        return res.status(200).json({
            message: 'missing @params'
        })
    }
    await pool.execute('insert into UserAccount(firstName, lastName, email, address) values(?, ?, ?, ?)', [firstName, lastName, email, address]);
    return res.status(200).json({
        message: 'ok'
    })
}

let updateUser = async (req, res) => { // PUT function
    let { firstName, lastName, email, address, id } = req.body;
    if (!firstName || !lastName || !email || !address || !id) {
        return res.status(200).json({
            message: 'missing @params'
        })
    }

    await pool.execute('update UserAccount set firstName = ?, lastName= ?, email = ?, address= ? WHERE id = ?',
        [firstName, lastName, email, address, id]);
    return res.status(200).json({
        message: 'ok'
    })
    
}

let deleteUser = async (req, res) => { // DELETE function
     let userId = req.params.id;
     if (!userId) { 
        return res.status(200).json({
            message: 'missing @params'
        })
    }

    await pool.execute('delete from UserAccount where id = ?', [userId])
      return res.status(200).json({
        message: 'ok'
    })
}
const getUserPreferences = async (req , res) => {
  try {
    const [userPreferences] = await pool.execute(`SELECT * FROM UserProfile`); 
    res.status(200).json({
      message: 'ok',
      data: userPreferences
    });
  } catch (error) {
    console.error('Error retrieving user names:', error); // Log error details
    res.status(500).json({
      message: 'Error retrieving preferences',
      error: error.message
    });
  }
}
//TOWNSHEND: I created a simpler function that isolated the user firstName and lastName
// but may not be good for sorting.
const getUserNames = async (req, res) => {
    try {
      const [users] = await pool.execute(`SELECT * FROM UserAccount`); // uses mysql2 function to access database
      res.status(200).json({
        message: 'ok',
        data: users
      });
    } catch (error) {
      console.error('Error retrieving user names:', error); // Log error details
      res.status(500).json({
        message: 'Error retrieving user names',
        error: error.message
      });
    }
};
let addFriend = async (req, res) => {
  const { user_id_2, user_2_first_name, user_2_last_name } = req.body;

  // Validate that all necessary parameters are provided
  if (!user_id_2 || !user_2_first_name || !user_2_last_name) {
      return res.status(400).json({
          message: 'Missing parameters'
      });
  }

  try {
      // Assuming you have an `id` auto-incremented field in your FriendsList table, and that user_id_1 is no longer required
      const [result] = await pool.execute(
          'INSERT INTO FriendsList (user_id_2, user_2_first_name, user_2_last_name) VALUES (?, ?, ?)',
          [user_id_2, user_2_first_name, user_2_last_name]
      );
      
      res.status(201).json({
          message: 'Friend added successfully',
          data: result
      });
  } catch (error) {
      console.error('Error adding friend:', error);
      res.status(500).json({
          message: 'Error adding friend',
          error: error.message
      });
  }
};

let getUserProfile = async (req, res) => {
    const userId = req.params.userId;
    if (!userId) {
        return res.status(400).json({
            message: 'Missing userId parameter'
        });
    }
    try {
        const [rows] = await pool.execute('SELECT * FROM UserProfile WHERE id = ?', [userId]);
        if (rows.length > 0) {
            return res.status(200).json({
                message: 'ok',
                data: rows[0]
            });
        } else {
            return res.status(404).json({
                message: 'User not found'
            });
        }
    } catch (error) {
        console.error('Error retrieving user profile:', error);
        return res.status(500).json({
            message: 'Error retrieving user profile',
            error: error.message
        });
    }
};

let updateRating = async (req, res) => {
    const { rating, user_id } = req.body;

    if (!rating || !user_id) {
        return res.status(400).json({ message: 'Missing rating or user_id parameter' });
    }

    try {
        // 1. Insert NEW rating into UserRatings table
        const insertQuery = `
            INSERT INTO UserRatings (userId, rating)
            VALUES (?, ?)
        `;
        await pool.execute(insertQuery, [user_id, rating]);

        // 2. Recalculate the user's average rating
        const avgQuery = `
            SELECT AVG(rating) AS avgRating
            FROM UserRatings
            WHERE userId = ?
        `;
        const [rows] = await pool.execute(avgQuery, [user_id]);

        const average = rows[0].avgRating;

        // 3. Update UserProfile with the new average
        const updateProfileQuery = `
            UPDATE UserProfile
            SET rating = ?
            WHERE id = ?
        `;
        await pool.execute(updateProfileQuery, [average, user_id]);

        return res.status(200).json({
            message: "Rating added and average updated!",
            average: average,
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({
            message: "Failed to update rating",
            error,
        });
    }
};

// let updateProficiency = async (req, res) => {
//     const { proficiency, user_id } = req.body;

//     if (proficiency === undefined || user_id === undefined) {
//         return res.status(400).json({ message: 'Missing proficiency or user_id parameter' });
//     }

//     try {
//         const query = 'UPDATE UserProfile SET proficiency = ? WHERE id = ?';
//         await pool.execute(query, [proficiency, user_id]);
//         return res.status(200).json({ message: 'Proficiency updated successfully!' });
//     } catch (error) {
//         return res.status(500).json({ message: 'Failed to update proficiency', error });
//     }
// };

const addComment = async (req, res) => {
    const { comment, user_id } = req.body;

    if (!comment || !user_id) {
        return res.status(400).json({ message: 'Missing comment or user_id parameter' });
    }

    try {
        const query = 'UPDATE UserProfile SET comments = ? WHERE id = ?';
        await pool.execute(query, [String(comment), user_id]);  // Explicitly cast comment to string
        return res.status(200).json({ message: 'Comment added successfully!' });
    } catch (error) {
        return res.status(500).json({ message: 'Failed to add comment', error });
    }
};

let getUserProficiencyAndRating = async (req, res) => {
    const userId = req.params.userId;
    if (!userId) {
        return res.status(400).json({
            message: 'Missing userId parameter'
        });
    }
    try {
        const [rows] = await pool.execute('SELECT target_language_proficiency, rating FROM UserProfile WHERE id = ?', [userId]);
        if (rows.length > 0) {
            return res.status(200).json({
                message: 'ok',
                data: rows[0]
            });
        } else {
            return res.status(404).json({
                message: 'User not found'
            });
        }
    } catch (error) {
        console.error('Error retrieving user proficiency and rating:', error);
        return res.status(500).json({
            message: 'Error retrieving user proficiency and rating',
            error: error.message
        });
    }
};

let addToFriendsList = async (req, res) => {
  let { userId, friendsList } = req.body; // friendsList can be array or JSON string

  if (!userId || friendsList == null) {
    return res.status(400).json({ message: 'Missing userId or friendsList' });
  }

  // Normalize to an array
  try {
    if (typeof friendsList === 'string') {
      friendsList = JSON.parse(friendsList); // if frontend sent a JSON string
    }
  } catch (e) {
    return res.status(400).json({ message: 'friendsList must be a JSON array or array' });
  }

  if (!Array.isArray(friendsList)) {
    return res.status(400).json({ message: 'friendsList must be an array' });
  }

  // Optional: dedupe + coerce to numbers/strings consistently
  const normalized = Array.from(new Set(friendsList.map(v => Number.isNaN(Number(v)) ? String(v) : Number(v))));

  try {
    // IMPORTANT: pass valid JSON into a JSON column
    await pool.execute(
      'UPDATE UserProfile SET friends_list = CAST(? AS JSON) WHERE id = ?',
      [JSON.stringify(normalized), userId]
    );

    return res.status(200).json({ message: 'Friends list updated successfully' });
  } catch (error) {
    console.error('Error updating friends list:', error);
    return res.status(500).json({ message: 'Error updating friends list', error: error.message });
  }
};

let getFriendsList = async (req, res) => {
  const { id: userId } = req.query;

  if (!userId) {
    return res.status(400).json({ message: 'Missing user ID' });
  }

  try {
    const [rows] = await pool.execute(
      'SELECT friends_list FROM UserProfile WHERE id = ?',
      [userId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const raw = rows[0].friends_list;

    // mysql2 will usually give you back a JS object/array for JSON columns.
    // But if your driver returns a string, parse it.
    const friendsList = Array.isArray(raw)
      ? raw
      : raw
        ? (typeof raw === 'string' ? JSON.parse(raw) : raw)
        : [];

    return res.status(200).json({ friendsList });
  } catch (error) {
    console.error('Error fetching friends list:', error);
    return res.status(500).json({ message: 'Error fetching friends list', error: error.message });
  }
};

let removeFriend = async (req, res) => {
  const { userId, friendId } = req.body;
  if (!userId || !friendId) {
    return res.status(400).json({ message: 'Missing userId or friendId' });
  }

  try {
    // Get current list
    const [rows] = await pool.execute(
      'SELECT friends_list FROM UserProfile WHERE id = ?',
      [userId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    let list = rows[0].friends_list;
    list = Array.isArray(list)
      ? list
      : list
        ? (typeof list === 'string' ? JSON.parse(list) : list)
        : [];

    const updated = list.filter(id => id != friendId);

    await pool.execute(
      'UPDATE UserProfile SET friends_list = CAST(? AS JSON) WHERE id = ?',
      [JSON.stringify(updated), userId]
    );

    return res.status(200).json({ message: 'Friend removed successfully', friendsList: updated });
  } catch (error) {
    console.error('Error removing friend:', error);
    return res.status(500).json({ message: 'Error removing friend', error: error.message });
  }
};


let addTrueFriend = async (req, res) => {

    try {
      console.log('addTrueFriend hit with body:', req.body);
      let { userId1, userId2 } = req.body;
      userId1 = Number(userId1);
      userId2 = Number(userId2);

      if (!userId1 || !userId2) {
        return res.status(400).json({ error: 'userId1 and userId2 are required' });
      }
      if (userId1 === userId2) {
        return res.status(400).json({ error: 'Cannot friend yourself' });
      }

      const a = Math.min(userId1, userId2);
      const b = Math.max(userId1, userId2);

      // Insert (handle duplicates)
      const sql = 'INSERT INTO FriendsModel (user1_id, user2_id) VALUES (?, ?)';
      await pool.execute(sql, [a, b]);

      return res.status(201).json({ message: 'Friend added', user_one_id: a, user_two_id: b });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'Friendship already exists' });
    }
    console.error('addTrueFriend error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

let removeTrueFriend = async (req, res) => {
  try {
    const { userId1, userId2 } = req.body; // extract IDs from body

    const sql = `
      DELETE FROM FriendsModel
      WHERE (user1_id = ? AND user2_id = ?)
         OR (user1_id = ? AND user2_id = ?)
    `;
    const [result] = await pool.execute(sql, [userId1, userId2, userId2, userId1]);

    if (result.affectedRows > 0) {
      res.status(200).json({ message: 'Friend removed successfully' });
    } else {
      res.status(404).json({ message: 'No friendship found' });
    }
  } catch (err) {
    console.error('Error removing friend:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

let getTrueFriendsList = async (req, res) => {
  try {
    const userId = Number(req.params.userId);
    if (!userId) return res.status(400).json({ error: 'userId is required' });

    const [rows] = await pool.query(
      `
      SELECT u.id, u.firstName, u.lastName, u.email
      FROM FriendsModel f
      JOIN UserAccount u ON u.id = f.user2_ID
      WHERE f.user1_ID = ?
      UNION
      SELECT u.id, u.firstName, u.lastName, u.email
      FROM FriendsModel f
      JOIN UserAccount u ON u.id = f.user1_ID
      WHERE f.user2_ID = ?
      `,
      [userId, userId]
    );

    // Convert BinaryRows → plain objects
    const friends = rows.map(r => ({ ...r }));

    //console.log('Final plain friends list:', friends);
    return res.status(200).json({ friendsList: friends });
  } catch (err) {
    console.error('Error retrieving friends:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

let getUserAvailability = async (req, res) => {
  const { userId } = req.params;

  if (!userId) {
    return res.status(400).json({ message: "Missing userId parameter" });
  }

  try {
    const [rows] = await pool.execute(
      "SELECT id, day_of_week, start_time, end_time FROM UserAvailability WHERE user_id = ? ORDER BY start_time ASC",
      [userId]
    );

    return res.status(200).json({
      message: "Availability fetched successfully",
      availability: rows,
    });
  } catch (error) {
    console.error("Error fetching availability:", error);
    return res.status(500).json({
      message: "Failed to fetch availability",
      error,
    });
  }
};

let createMeeting = async (req, res) => {
  try {
    const { user1_id, user2_id, day_of_week, start_time, end_time } = req.body;

    // Basic validation
    if (!user1_id || !user2_id || !day_of_week || !start_time || !end_time) {
      return res.status(400).json({
        message: "Missing required fields (user1_id, user2_id, start_time, end_time)"
      });
    }

    // Create meeting
    const [results] = await db.sequelize.query(
      `
      INSERT INTO MeetingModel (user1_id, user2_id, day_of_week, start_time, end_time)
      VALUES (?, ?, ?, ?, ?)
      `,
      {
        replacements: [user1_id, user2_id, day_of_week, start_time, end_time]
      }
    );

    return res.status(201).json({
      message: "Meeting created successfully",
      insertedId: results,  // MySQL returns the insertId here
    });

  } catch (error) {
    console.error("Error creating meeting:", error);
    return res.status(500).json({
      message: "Failed to create meeting",
      error: error.message,
    });
  }
};

let deleteMeeting = async (req, res) => {
  try {
    const { user1_id, user2_id, day_of_week, start_time } = req.body;

    if (!user1_id || !user2_id || !day_of_week || !start_time) {
      return res.status(400).json({
        message: "Missing required fields (user1_id, user2_id, day_of_week, start_time)",
      });
    }

    const [results] = await db.sequelize.query(
      `
      DELETE FROM MeetingModel
      WHERE user1_id = ?
        AND user2_id = ?
        AND day_of_week = ?
        AND start_time = ?
      `,
      {
        replacements: [user1_id, user2_id, day_of_week, start_time],
      }
    );

    return res.status(200).json({
      message: "Meeting removed successfully",
      affectedRows: results.affectedRows || 0,
    });

  } catch (error) {
    console.error("Error deleting meeting:", error);
    return res.status(500).json({
      message: "Failed to delete meeting",
      error: error.message,
    });
  }
};

const APIController = { 
    addFriend, getAllUsers, createNewUser, updateUser, deleteUser, getUserNames, getUserPreferences, getUserProfile, updateRating, 
    addComment, getUserProficiencyAndRating, addToFriendsList, getFriendsList,  removeFriend, addTrueFriend, removeTrueFriend, 
    getTrueFriendsList, getUserAvailability, createMeeting, deleteMeeting
};
export default APIController;
