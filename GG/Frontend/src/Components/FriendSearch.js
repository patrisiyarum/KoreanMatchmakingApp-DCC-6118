import React, { useState, useEffect } from 'react';
import { FiUserPlus } from 'react-icons/fi';
import { DateTime } from "luxon";  
import Select from "react-select";

import {
  handleGetUserNamesApi,
  handleGetUserPreferencesApi,
  handleGetUserProfileApi,
} from '../Services/findFriendsService';
import './FriendSearch.css';
import {
  createSearchParams,
  useSearchParams,
  useNavigate,
} from 'react-router-dom';
import { getUserData } from '../Utils/userData';
import {
  handleGetAllInterests,
  handleGetUserInterests,
  handleGetUserAvailability,
  handleAddTrueFriend,
} from '../Services/userService';

const FriendSearch = () => {
  const [filterInput, setFilterInput] = useState('');
  const [preferenceFilterInput, setPreferenceFilterInput] = useState('');
  const [recentChatPartners, setRecentChatPartners] = useState([]);
  const [userNames, setUserNames] = useState([]);
  const [allUserNames, setAllUserNames] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedUserProfile, setSelectedUserProfile] = useState(null);
  const [compatibilityScore, setCompatibilityScore] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const navigate = useNavigate();
  const [search] = useSearchParams();
  const id = search.get('id');
  const [userList, setUserList] = useState('');
  const [selectedAvailability, setSelectedAvailability] = useState(null);
  const [allInterests, setAllInterests] = useState([]);
  const [selectedInterests, setSelectedInterests] = useState([]);
  const [selectedMbti, setSelectedMbti] = useState([]);
  const [selectedZodiac, setSelectedZodiac] = useState([]);

  const handleAvailabilityFilter = () => {
    if (!selectedAvailability || selectedAvailability.length === 0) {
      setSuccessMessage('Please select availability times first');
      setTimeout(() => setSuccessMessage(''), 3000);
      return;
    }

    try {
      const selectedSlotsUTC = selectedAvailability.map(slot => {
        const convertTo24Hr = (timeStr) => {
          const dt = DateTime.fromFormat(timeStr.trim(), "h a", { zone: currentUser?.default_time_zone || "UTC" });
          return dt.isValid ? dt.toFormat("HH:mm") : null;
        };
        
        const start = convertTo24Hr(slot.time);
        const end = DateTime.fromFormat(start, "HH:mm").plus({ hours: 1 }).toFormat("HH:mm");
        return {
          day_of_week: slot.day,
          start_utc: DateTime.fromISO(`2024-01-01T${start}`, { zone: currentUser?.default_time_zone || "UTC" }).toUTC(),
          end_utc: DateTime.fromISO(`2024-01-01T${end}`, { zone: currentUser?.default_time_zone || "UTC" }).toUTC(),
        };
      });

      const filteredUsers = allUserNames.filter(user => {
        if (!Array.isArray(user.Availability) || user.Availability.length === 0)
          return false;

        const userZone = user.default_time_zone || "UTC";
        return user.Availability.some(userSlot => {
          const userStartUTC = DateTime.fromISO(`2024-01-01T${userSlot.start_time}`, { zone: userZone }).toUTC();
          const userEndUTC = DateTime.fromISO(`2024-01-01T${userSlot.end_time}`, { zone: userZone }).toUTC();

          return selectedSlotsUTC.some(selSlot =>
            userSlot.day_of_week === selSlot.day_of_week &&
            userStartUTC.toISO() === selSlot.start_utc.toISO() &&
            userEndUTC.toISO() === selSlot.end_utc.toISO()
          );
        });
      });
      setUserNames(filteredUsers);
      setSuccessMessage(`Filtered by availability`);
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      setSuccessMessage("Error applying availability filter");
      setTimeout(() => setSuccessMessage(""), 3000);
    }
  };

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const userResponse = await handleGetUserNamesApi();
        const profilesResponse = await handleGetUserPreferencesApi();

        const mergedUsers = await Promise.all(
          userResponse.data.map(async (user) => {
            const userProfile = profilesResponse.data.find(
              (profile) => profile.id === user.id
            );
        
            let userInterests = [];
            try {
              const interestsResponse = await handleGetUserInterests(user.id);
              userInterests = interestsResponse || [];
            } catch {}

            let userAvailability = [];
            try {
              const availabilityResponse = await handleGetUserAvailability(user.id);
              userAvailability = availabilityResponse || [];
            } catch {}
        
            return {
              ...user,
              ...userProfile,
              Interests: userInterests,
              Availability: userAvailability,
              score: null,
            };
          })
        );

        const visibleUsers = mergedUsers.filter((user) => user.visibility === 'Show');

        setUserNames(visibleUsers);
        setAllUserNames(visibleUsers);

        const currentUserData = getUserData();
        setCurrentUser(currentUserData);

        setLoading(false);
      } catch (err) {
        setError(err);
        setLoading(false);
      }
    };

    fetchUserData();

    const fetchInterests = async () => {
      try {
        const res = await handleGetAllInterests();
        const raw = res?.data ?? res;
        const names = Array.isArray(raw)
          ? raw.map(i => i?.interest_name ?? i?.name ?? i).filter(Boolean)
          : [];
        const uniqueSorted = Array.from(new Set(names)).sort((a,b) => a.localeCompare(b));
        setAllInterests(uniqueSorted);
      } catch {
        setAllInterests([]);
      }
    };

    fetchInterests();
    
  }, [id]);

  useEffect(() => {
    const availabilityParam = search.get('availability');
    if (availabilityParam) {
      try {
        setSelectedAvailability(JSON.parse(availabilityParam));
      } catch {}
    }
  }, [search]);

  useEffect(() => {
    if (selectedAvailability && selectedAvailability.length > 0 && allUserNames.length > 0) {
      handleAvailabilityFilter();
    }
  }, [selectedAvailability, allUserNames]);

  const handleQuickAddFriend = async (user) => {
    try {
      await handleAddTrueFriend(Number(id), Number(user.id));

      setSuccessMessage(`Added ${user.firstName} ${user.lastName} to your friends!`);
      setTimeout(() => setSuccessMessage(''), 2500);
    } catch (err) {
      const msg = err?.response?.data?.error || err.message;
      setSuccessMessage(
        msg === 'Friendship already exists'
          ? 'Already friends!'
          : `Could not add friend: ${msg}`
      );
      setTimeout(() => setSuccessMessage(''), 2500);
    }
  };

  const fetchUserProfile = async (userId) => {
    try {
      const response = await handleGetUserProfileApi(userId);
      setSelectedUserProfile(response.data);
    } catch {}
  };

  const calculateCompatibilityScore = (selectedProfile) => {
    if (!currentUser || !selectedProfile) return 0;

    const genderScore =
      6 * (selectedProfile.gender === currentUser.gender ? 1 : 0);
    const professionScore =
      5 * (selectedProfile.profession === currentUser.profession ? 1 : 0);

    const interestsA = (selectedProfile.Interests || []).map(i => i.interest_name || i);
    const interestsB = (currentUser.Interests || []).map(i => i.interest_name || i);
    const shared = interestsA.filter(n => interestsB.includes(n));
    const interestsScore = 2 * shared.length;

    const ageDifferenceScore =
      -0.3 * Math.abs((selectedProfile.age || 0) - (currentUser.age || 0));

    const totalScore =
      genderScore + professionScore + interestsScore + ageDifferenceScore;

    return parseFloat(totalScore.toFixed(2));
  };

  const calculateAllCompatibilityScores = () => {
    const scoredUsers = userNames.map((user) => {
      const score = calculateCompatibilityScore(user);
      return { ...user, score };
    });

    const sortedUsers = scoredUsers.sort((a, b) => b.score - a.score);
    setUserNames(sortedUsers);
  };

  const handleNameFilter = () => {
    const q = filterInput.trim().toLowerCase();
    if (!q) return setUserNames(allUserNames);

    const filtered = allUserNames.filter(
      (u) =>
        u.firstName.toLowerCase().includes(q) ||
        u.lastName.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q)
    );

    setUserNames(filtered.length > 0 ? filtered : allUserNames);
  };

  const handlePreferenceFilter = async () => {
    const q = preferenceFilterInput.trim().toLowerCase();

    if (!q) return setUserNames(allUserNames);

    try {
      const preferencesResponse = await handleGetUserPreferencesApi();
      const preferences = preferencesResponse.data;

      const filteredPreferences = preferences.filter((pref) =>
        Object.values(pref).some((value) =>
          String(value).toLowerCase().includes(q)
        )
      );

      if (filteredPreferences.length === 0) {
        setUserNames(allUserNames);
      } else {
        const matchedIds = filteredPreferences.map((p) => p.id);
        const filteredNames = allUserNames.filter((user) =>
          matchedIds.includes(user.id)
        );
        setUserNames(filteredNames.length > 0 ? filteredNames : allUserNames);
      }
    } catch {}
  };

  const handleClearAvailabilityFilter = () => {
    setSelectedAvailability(null);
    setUserNames(allUserNames);
  };

  const handleUserClick = async (user) => {
    fetchUserProfile(user.id);

    if (!recentChatPartners.some((partner) => partner.id === user.id)) {
      setRecentChatPartners([...recentChatPartners, user]);
    }
  };

  const handleNavigateToAvailabilityPicker = () => {
    navigate({
      pathname: '/AvailabilityPicker',
      search: createSearchParams({ id }).toString(),
    });
  };

  const handleBack = () => {
    navigate({
      pathname: '/Dashboard',
      search: createSearchParams({ id }).toString(),
    });
  };

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error: {error.message}</p>;

  const getField = (user, fieldNames) => {
    for (let field of fieldNames) {
      if (user[field] !== undefined && user[field] !== null) {
        return user[field];
      }
    }
    return 'N/A';
  };

  const MBTI_OPTIONS = [
    'INTJ','INTP','ENTJ','ENTP',
    'INFJ','INFP','ENFJ','ENFP',
    'ISTJ','ISFJ','ESTJ','ESFJ',
    'ISTP','ISFP','ESTP','ESFP'
  ];
  const ZODIAC_OPTIONS = [
    'Aries','Taurus','Gemini','Cancer','Leo','Virgo',
    'Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'
  ];

  const MBTI_OPTIONS_OPT   = MBTI_OPTIONS.map(v => ({ value: v, label: v }));
  const ZODIAC_OPTIONS_OPT = ZODIAC_OPTIONS.map(v => ({ value: v, label: v }));

  const customSelectStyles = {
    container: (base) => ({ ...base, width: '100%' }),
    control:   (base, state) => ({
      ...base,
      minHeight: 42,
      borderRadius: 6,
      borderColor: state.isFocused ? '#6344A6' : '#ccc',
      boxShadow: 'none',
      '&:hover': { borderColor: '#6344A6' }
    }),
    multiValue:       (base) => ({ ...base, background: '#ede7f6' }),
    multiValueLabel:  (base) => ({ ...base, color: '#6344A6' }),
    multiValueRemove: (base) => ({
      ...base,
      color: '#6344A6',
      ':hover': { background: '#6344A6', color: '#fff' }
    }),
    menu: (base) => ({ ...base, zIndex: 5 })
  };

  const applyPersonalityFilters = () => {
    let base = allUserNames;

    const q = (filterInput || '').trim().toLowerCase();
    if (q) {
      base = base.filter(u =>
        (u.firstName || '').toLowerCase().includes(q) ||
        (u.lastName  || '').toLowerCase().includes(q) ||
        (u.email     || '').toLowerCase().includes(q)
      );
    }

    if (selectedMbti.length) {
      const mbtiSet = new Set(selectedMbti.map(v => v.toUpperCase()));
      base = base.filter(u => mbtiSet.has(String(u.mbti || '').toUpperCase()));
    }

    if (selectedZodiac.length) {
      const zSet = new Set(selectedZodiac.map(v => v.toLowerCase()));
      base = base.filter(u => zSet.has(String(u.zodiac || '').toLowerCase()));
    }

    if (selectedInterests.length) {
      const wanted = new Set(selectedInterests.map(v => v.toLowerCase()));

      base = base.filter(u => {
        const userInterestStrings = [];

        if (Array.isArray(u.Interests)) {
          for (const it of u.Interests) {
            const name = (it?.interest_name ?? it)?.toString().toLowerCase();
            if (name) userInterestStrings.push(name);
          }
        }

        const extras = [u.interests, u.interest, u.hobby]
          .filter(Boolean)
          .flatMap(v => Array.isArray(v) ? v : [v])
          .map(v => String(v).toLowerCase());

        userInterestStrings.push(...extras);

        return userInterestStrings.some(s => wanted.has(s));
      });
    }

    setUserNames(base);
  };

  const clearPersonalityFilters = () => {
    setSelectedMbti([]);
    setSelectedZodiac([]);
    setSelectedInterests([]);
    setUserNames(allUserNames);
  };

  return (
    <div className="friend-search-container">
      <div className="filter-sidebar">
        <div className="filter-section">
          <h3>Filter Users by Name</h3>
          <input
            type="text"
            placeholder="Enter name or email"
            value={filterInput}
            onChange={(e) => setFilterInput(e.target.value)}
          />
          <button className="filter-btn" onClick={handleNameFilter}>
            Filter by Name
          </button>
        </div>

        <div className="filter-section">
          <h3>Filter Users by MBTI & Zodiac</h3>

          <div className="two-col">
            <div>
              <label className="filter-label">MBTI (multi-select)</label>
              <Select
                isMulti
                options={MBTI_OPTIONS_OPT}
                value={MBTI_OPTIONS_OPT.filter(o => selectedMbti.includes(o.value))}
                onChange={(vals) => setSelectedMbti((vals || []).map(v => v.value))}
                placeholder="Select MBTI types…"
                styles={customSelectStyles}
              />
            </div>

            <div>
              <label className="filter-label">Zodiac (multi-select)</label>
              <Select
                isMulti
                options={ZODIAC_OPTIONS_OPT}
                value={ZODIAC_OPTIONS_OPT.filter(o => selectedZodiac.includes(o.value))}
                onChange={(vals) => setSelectedZodiac((vals || []).map(v => v.value))}
                placeholder="Select zodiac signs…"
                styles={customSelectStyles}
              />
            </div>
          </div>

          <div className="btn-row spread">
            <button className="filter-btn" onClick={applyPersonalityFilters}>
              Apply Filters
            </button>
            <button className="filter-btn" onClick={clearPersonalityFilters}>
              Clear
            </button>
          </div>
        </div>

        <div className="filter-section">
          <h3>Filter Users by Interest(s)</h3>

          <label className="filter-label">Interests (multi-select)</label>
          <Select
            isMulti
            options={allInterests.map(n => ({ value: n, label: n }))}
            value={allInterests
              .map(n => ({ value: n, label: n }))
              .filter(o => selectedInterests.includes(o.value))}
            onChange={(vals) => setSelectedInterests((vals || []).map(v => v.value))}
            placeholder="Select interests…"
            styles={customSelectStyles}
          />

          <div className="btn-row spread" style={{ marginTop: 10 }}>
            <button
              className="filter-btn"
              onClick={applyPersonalityFilters}
            >
              Apply Interests
            </button>
            <button
              className="filter-btn"
              onClick={() => {
                setSelectedInterests([]);
                setUserNames(allUserNames);
              }}
            >
              Clear
            </button>
          </div>
        </div>

        <div className="filter-section">
          <h3>Filter by Availability</h3>
          <button
            className="filter-btn availability-btn"
            onClick={handleNavigateToAvailabilityPicker}
          >
            Filter by Availability
          </button>
          {selectedAvailability && selectedAvailability.length > 0 && (
            <div className="availability-display">
              <p className="availability-label">Selected Times:</p>
              <div className="availability-slots">
                {selectedAvailability.map((slot, index) => (
                  <span key={index} className="availability-slot">
                    {slot.day} {slot.time}
                  </span>
                ))}
              </div>
              <button className="clear-availability-btn" onClick={handleClearAvailabilityFilter}>
                Clear Availability Filter
              </button>
            </div>
          )}
        </div>
        <button className="btn-back" onClick={handleBack}>
          Back
        </button>
      </div>

      <div className="friend-search">
        <h1>User Table</h1>
        <button
          className="calculate-score-btn"
          onClick={calculateAllCompatibilityScores}
        >
          Calculate Compatibility Scores
        </button>

        <div className="table-container">
          <table className="user-table">
            <thead>
              <tr>
                <th>Actions</th>
                <th>First Name</th>
                <th>Last Name</th>
                <th>ID</th>
                <th>Email</th>
                <th>Gender</th>
                <th>Profession</th>
                <th>Interests</th>
                <th>MBTI</th>
                <th>Zodiac</th>
                <th>Time Zone</th>
                <th>Age</th>
                <th>Native Language</th>
                <th>Target Language</th>
                <th>Compatibility Score</th>
                <th>Availability</th>
              </tr>
            </thead>

            <tbody>
              {userNames.map((user, index) => (
                <tr
                  key={index}
                  onClick={() => handleUserClick(user)}
                  className="table-row"
                >
                  <td>
                    <button
                      className="add-friend-btn"
                      title="Add friend"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleQuickAddFriend(user);
                      }}
                    >
                      <FiUserPlus size={18} />
                    </button>
                  </td>

                  <td>{user.firstName}</td>
                  <td>{user.lastName}</td>
                  <td>{user.id}</td>
                  <td>{user.email}</td>
                  <td>{user.gender}</td>
                  <td>{user.profession}</td>
                  <td>
                    {Array.isArray(user.Interests)
                      ? user.Interests.map(i => i.interest_name).join(', ')
                      : ''}
                  </td>
                  <td>{user.mbti}</td>
                  <td>{user.zodiac}</td>
                  <td>{user.default_time_zone}</td>
                  <td>{user.age}</td>
                  <td>{getField(user, ["nativeLanguage", "native_language"])}</td>
                  <td>{getField(user, ["targetLanguage", "target_language"])}</td>
                  <td>{user.score !== null ? user.score : "N/A"}</td>

                  <td>
                    {Array.isArray(user.Availability)
                      ? user.Availability.map(a => `${a.day_of_week} ${a.start_time}`).join(', ')
                      : ''}
                  </td>

                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {successMessage && (
          <div className="success-message">
            <p>{successMessage}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default FriendSearch;