import React, { useState, useEffect } from 'react';
import { createSearchParams, useSearchParams, useNavigate } from "react-router-dom";
import { handleGetTranscripts } from '../Services/transcriptService';
import './TranscriptView.css';

function TranscriptView() {
    const [search] = useSearchParams();
    const navigate = useNavigate();
    const id = search.get("id");

    const [transcripts, setTranscripts] = useState([]);
    const [filteredTranscripts, setFilteredTranscripts] = useState([]);
    const [filterDate, setFilterDate] = useState('');
    const [loading, setLoading] = useState(true);
    const [expandedSessionId, setExpandedSessionId] = useState(null);

    // Fetch transcripts on component mount
    useEffect(() => {
        const fetchTranscripts = async () => {
            try {
                // Using internal mock service which now returns sessionId, transcript, date
                const response = await handleGetTranscripts(id); 
                let output = [];
                for (const item of response.messageData) {
                    const el = {
                        "date": item.createdAt,
                        "transcript": item.transcript,
                        "sessionId": item.sessionId
                    }
                    output.push(el);
                }
                console.log(output);
                
                // Default sort: Ordered by time (Newest first)
                const sortedData = output.sort((a, b) => new Date(b.date) - new Date(a.date));
                console.log(sortedData);
                
                setTranscripts(sortedData);
                setFilteredTranscripts(sortedData);
                setLoading(false);
            } catch (error) {
                console.error('Error fetching transcripts:', error);
                setLoading(false);
            }
        };

        fetchTranscripts();
    }, [id]);

    const handleDateChange = (e) => {
        const selectedDate = e.target.value;
        setFilterDate(selectedDate);
        setExpandedSessionId(null); // Collapse any open transcripts when filtering

        if (selectedDate) {
            const filtered = transcripts.filter(t => 
                t.date.startsWith(selectedDate)
            );
            setFilteredTranscripts(filtered);
        } else {
            setFilteredTranscripts(transcripts);
        }
    };

    // Toggle the full transcript view
    const handleToggleTranscript = (sessionId) => {
        if (expandedSessionId === sessionId) {
            setExpandedSessionId(null); // Collapse it
        } else {
            setExpandedSessionId(sessionId); // Expand this one
        }
    };

    // Navigate to Assistant page with the chatId
    const handleContinueChat = (sessionId) => {
        navigate({
            pathname: "/Assistant",
            search: createSearchParams({ 
                id: id,
                chatId: sessionId 
            }).toString(),
        });
    };

    // Navigate back to the dashboard
    const handleBack = () => {
        navigate({
            pathname: "/Dashboard",
            search: createSearchParams({ id: id }).toString(),
        });
    };

    // Helper to format date for display
    const formatDate = (dateString) => {
        const options = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
        return new Date(dateString).toLocaleDateString(undefined, options);
    };

    // Helper to generate a short preview from the full transcript text
    const getPreview = (fullTranscript) => {
        const maxLength = 100;
        if (!fullTranscript) return "No transcript available.";
        if (fullTranscript.length > maxLength) {
            return fullTranscript.substring(0, maxLength).trim() + "...";
        }
        return fullTranscript;  
    };

    return (
        <>
            <div className="screen-Background">
                <div className="screen-Container transcript-container">
                    <div className="screen-Content">
                        <h2>Conversation History</h2>

                        {/* Filter Section */}
                        <div className="filter-container">
                            <label htmlFor="date-filter" className="filter-label">Filter by Date:</label>
                            <input 
                                type="date" 
                                id="date-filter"
                                className="date-input"
                                value={filterDate}
                                onChange={handleDateChange}
                            />
                        </div>

                        {/* Transcripts List */}
                        <div className="transcript-list-container">
                            {loading ? (
                                <p>Loading transcripts...</p>
                            ) : filteredTranscripts.length > 0 ? (
                                filteredTranscripts.map((item) => {
                                    const isExpanded = expandedSessionId === item.sessionId;
                                    return (
                                        <div key={item.sessionId} className="transcript-item">
                                            <div className="transcript-header">
                                                <span className="transcript-date">{formatDate(item.date)}</span>
                                                <span className="transcript-session-id">Session ID: {item.sessionId}</span>
                                            </div>

                                            {/* Show preview only if not expanded */}
                                            {!isExpanded && (
                                                <p className="transcript-preview">
                                                    {getPreview(item.transcript)}
                                                </p>
                                            )}
                                            
                                            {/* Show full transcript if expanded */}
                                            {isExpanded && (
                                                <div className="full-transcript-text">
                                                    {item.transcript}
                                                </div>
                                            )}

                                            <div className="transcript-actions">
                                                <button 
                                                    className={`btn-view-details ${isExpanded ? 'expanded' : ''}`}
                                                    onClick={() => handleToggleTranscript(item.sessionId)}
                                                >
                                                    {isExpanded ? 'Hide Transcript' : 'Read Full Transcript'}
                                                </button>
                                                <button 
                                                    className="btn-continue-chat"
                                                    onClick={() => handleContinueChat(item.sessionId)}
                                                >
                                                    Summarize with AI
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })
                            ) : (
                                <p>No conversations found for this date.</p>
                            )}
                        </div>

                        {/* Buttons */}
                        <div className="button-container">
                            <button className="btn-back-02" onClick={handleBack}>Back</button>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

export default TranscriptView;
