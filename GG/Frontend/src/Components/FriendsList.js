import React, { useEffect, useState } from 'react';
import Button from 'react-bootstrap/Button';
import './FriendsList.css';
import { useNavigate, createSearchParams, useSearchParams } from "react-router-dom";
import { handleGetFriendsList,handleGetTrueFriendsList, handleRemoveTrueFriend, handleAddToFriendsList } from '../Services/userService'; // Import your API handler

const FriendsList = () => {
  const [friends, setFriends] = useState([]);
  const navigate = useNavigate();
  const [search] = useSearchParams();
  const id = search.get("id");

  useEffect(() => {
    // Retrieve friends from localStorage
    const storedFriends = JSON.parse(localStorage.getItem('friendsList')) || [];
    //setFriends(storedFriends);
    console.log("Friends loaded from localStorage:", storedFriends);
  }, []);

  // Second useEffect: Fetch friends from the database
  useEffect(() => {
  const fetchFriends = async () => {
    try {
      console.log('FriendsList: id=', id);
      const payload = await handleGetTrueFriendsList(id);
      console.log('FriendsList payload:', payload); // expect { friendsList: [...] }
      setFriends(Array.isArray(payload?.friendsList) ? payload.friendsList : []);
    } catch (err) {
      console.error('Failed to fetch friends:', err);
      setFriends([]);
    }
  };
  if (id) fetchFriends();
}, [id]); // Dependencies: id and friends state

  const onRemoveFriend = async (friend) => {
    const currentUserId = Number(id);         // your user id from query string
  const targetUserId  = Number(friend.id);  // the friend’s id

  // Optimistic UI update (optional)
  setFriends(prev => prev.filter(f => f.id !== targetUserId));

  try {
    const res = await handleRemoveTrueFriend(currentUserId, targetUserId);
    console.log('removeTrueFriend:', res?.message || res);
  } catch (err) {
    console.error('removeTrueFriend failed:', err);
    // roll back optimistic update if you want:
    // setFriends(prev => [...prev, friend]);
  }
};

  const handleBack = () => {
    navigate({
      pathname: "/Dashboard", // Navigate back to the dashboard
      search: createSearchParams({ id: id }).toString(),
    });
  };

  return (
    <div className="screen-Background">
      <div className="friends-list-container">
        <h2>Your Friends List</h2>
        <p className="instructions">Please Click on a User to Remove them from Friends List</p>
        {friends.length === 0 ? (
          <p className="no-friends-message">No friends added yet.</p>
        ) : (
          <div className="friends-list">
            {friends.map(friend => (
              <div
                key={friend.id} // Ensure each item has a unique key
                className="friend-chip"
                onClick={() => {
                  onRemoveFriend(friend); // Pass them to the removeFriend function
                }}
              >
                {friend.firstName} {friend.lastName}
                <span className="remove-icon">×</span>
              </div>
            ))}
          </div>
        )}
        {/* Back Button */}
        <div className="button-container">
          <button className="btn-back-02" onClick={handleBack}>
            Back
          </button>
        </div>
      </div>
    </div>
  );
};

export default FriendsList;
