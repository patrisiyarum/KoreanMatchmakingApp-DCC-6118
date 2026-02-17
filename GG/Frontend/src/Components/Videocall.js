import React, { useState, useEffect } from 'react';
import './Videocall.css';
import VideoRoom from './VideoRoom';
import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';
import Form from 'react-bootstrap/Form';
import { useSearchParams, useNavigate, createSearchParams } from 'react-router-dom';
import { updateChatPrivacy } from '../Services/privacyService';

function Videocall() {
  const [room, setRoom] = useState('matchmaking');
  const [roomTouched, setRoomTouched] = useState(false);

  const [joined, setJoined] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [aiAllowed, setAiAllowed] = useState(true);

  const navigate = useNavigate();
  const [search] = useSearchParams();
  const userId = search.get('id') || '';
  const chatId = search.get('chatId') || '';
  const roomFromQuery = search.get('room');

  useEffect(() => {
    if (roomFromQuery && roomFromQuery.trim()) {
      setRoom(roomFromQuery.trim());
    }
  }, [roomFromQuery]);

  const roomIsValid = room.trim().length > 0;
  const roomHasError = roomTouched && !roomIsValid;

  const handleJoinClick = () => {
    setRoomTouched(true);
    if (!roomIsValid) return;
    setShowPrivacyModal(true);
  };

  const handleBack = () => navigate(-1);

  const goHome = () => {
    navigate({
      pathname: '/Dashboard',
      search: createSearchParams({ id: userId }).toString(),
    });
  };

  const confirmAndJoin = async () => {
    try {
      if (chatId) {
        await updateChatPrivacy(chatId, userId, aiAllowed);
      }
    } catch (err) {
      console.error('Failed to update chat privacy before join:', err);
    } finally {
      setShowPrivacyModal(false);
      setJoined(true);
    }
  };

  return (
    <div className="video-call-container">
      {/* Home button only visible BEFORE joining (prevents duplicate with VideoRoom top bar) */}
      {!joined && (
        <div className="vc-home-btn-wrap">
          <Button variant="primary" size="sm" onClick={goHome}>Home</Button>
        </div>
      )}

      {!joined ? (
        <div className="join-card">
          <h2 className="join-title">Join a Video Room</h2>
          <p className="join-subtitle">
            Enter a room name or code. You’ll confirm AI access on the next step.
          </p>

          <div className="join-form">
            <label htmlFor="room-input" className="join-label">Room name or code</label>
            <Form.Control
              id="room-input"
              placeholder="e.g., spanish-101 or A3F9XZ"
              value={room}
              onChange={(e) => setRoom(e.target.value)}
              onBlur={() => setRoomTouched(true)}
            />
            {roomHasError && (
              <div className="join-error">Please enter a room name or code.</div>
            )}
          </div>

          <div className="join-actions">
            <button className="btn-cta" onClick={handleJoinClick}>Join Room</button>
            <button className="btn-ghost" onClick={handleBack}>Back</button>
          </div>
        </div>
      ) : (
        <VideoRoom
          room={room}
          initialAiAllowed={aiAllowed}
          chatId={chatId}
          currentUserId={userId}
        />
      )}

      {/* Pre-join AI privacy modal */}
      <Modal show={showPrivacyModal} onHide={() => setShowPrivacyModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>AI access for this video call</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>Allow the app’s AI to access this conversation (e.g., for summaries or assistance)?</p>
          <Form.Check
            type="switch"
            id="ai-access-switch"
            label={aiAllowed ? 'Allowed' : 'Denied'}
            checked={aiAllowed}
            onChange={(e) => setAiAllowed(e.target.checked)}
          />
          <small>Your choice applies only to this conversation. You can change it during the call.</small>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="primary" onClick={confirmAndJoin} disabled={!roomIsValid}>
            Join
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}

export default Videocall;
