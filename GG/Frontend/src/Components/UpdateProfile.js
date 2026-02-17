import { useState, useEffect } from 'react';
import React from "react";
import './Registration.css';
import './UpdateProfile.css';
import Select from "react-select";

import {
  handleProfileUpdateAPI,
  handleGetAllInterests,
  handleGetUserInterests,
  handleReplaceUserInterests,
  handleGetUserAvailability,
  handleReplaceUserAvailability
} from '../Services/userService';

import { handleGetUserProfileApi } from '../Services/findFriendsService';
import { createSearchParams, useNavigate, useSearchParams } from "react-router-dom";

function UpdateProfile() {
  // Profile fields
  const [nativeLanguage, setNativeLanguage] = useState('');
  const [targetLanguage, setTargetLanguage] = useState('');
  const [targetLanguageProficiency, setTargetLanguageProficiency] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('');
  const [profession, setProfession] = useState('');
  const [mbti, setMBTI] = useState('');
  const [zodiac, setZodiac] = useState('');
  const [defaultTimeZone, setDefaultTimeZone] = useState('');
  const [visibility, setVisibility] = useState('');

  // Interests
  const [allInterests, setAllInterests] = useState([]);
  const [selectedInterests, setSelectedInterests] = useState([]);

  // Availability
  const [availability, setAvailability] = useState([]);

  // UI state
  const [errMsg, setErrMsg] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState(false);

  const [search] = useSearchParams();
  const id = search.get("id");
  const navigate = useNavigate();

  // Options
  const NativeLanguage = [
    { value: "English", label: "English" },
    { value: "Korean", label: "Korean" },
  ];

  const TargetLanguage = [
    { value: "English", label: "English" },
    { value: "Korean", label: "Korean" },
  ];

  const TargetLanguageProficiency = [
    { value: "Beginner", label: "Beginner" },
    { value: "Elementary", label: "Elementary" },
    { value: "Intermediate", label: "Intermediate" },
    { value: "Proficient", label: "Proficient" },
    { value: "Fluent", label: "Fluent" },
  ];

  const Gender = [
    { value: "Male", label: "Male" },
    { value: "Female", label: "Female" },
    { value: "Other", label: "Other" },
  ];

  // Keeping spelling as-is to match existing DB strings if any
  const Profession = [
    { value: "Education", label: "Education" },
    { value: "Engineering", label: "Engineering" },
    { value: "Retail", label: "Retail" },
    { value: "Finance", label: "Finance" },
    { value: "Law", label: "Law" },
    { value: "Medicine", label: "Medicine" },
    { value: "Scientist", label: "Scientist" },
  ];

  const Zodiac = [
    { value: "Aries", label: "Aries" },
    { value: "Taurus", label: "Taurus" },
    { value: "Gemini", label: "Gemini" },
    { value: "Cancer", label: "Cancer" },
    { value: "Leo", label: "Leo" },
    { value: "Virgo", label: "Virgo" },
    { value: "Libra", label: "Libra" },
    { value: "Scorpio", label: "Scorpio" },
    { value: "Sagittarius", label: "Sagittarius" },
    { value: "Capricorn", label: "Capricorn" },
    { value: "Aquarius", label: "Aquarius" },
    { value: "Pisces", label: "Pisces" },
  ];

  const TimeZones = [
    { value: "UTC", label: "UTC" },
    { value: "America/New_York", label: "America/New_York" },
    { value: "America/Chicago", label: "America/Chicago" },
    { value: "America/Denver", label: "America/Denver" },
    { value: "America/Los_Angeles", label: "America/Los_Angeles" },
    { value: "Europe/London", label: "Europe/London" },
    { value: "Europe/Paris", label: "Europe/Paris" },
    { value: "Asia/Seoul", label: "Asia/Seoul" },
    { value: "Asia/Tokyo", label: "Asia/Tokyo" },
  ];

  const MBTI = [
    { value: "INTJ", label: "INTJ" },
    { value: "INTP", label: "INTP" },
    { value: "ENTJ", label: "ENTJ" },
    { value: "ENTP", label: "ENTP" },
    { value: "INFJ", label: "INFJ" },
    { value: "INFP", label: "INFP" },
    { value: "ENFJ", label: "ENFJ" },
    { value: "ENFP", label: "ENFP" },
    { value: "ISTJ", label: "ISTJ" },
    { value: "ISFJ", label: "ISFJ" },
    { value: "ESTJ", label: "ESTJ" },
    { value: "ESFJ", label: "ESFJ" },
    { value: "ISTP", label: "ISTP" },
    { value: "ISFP", label: "ISFP" },
    { value: "ESTP", label: "ESTP" },
    { value: "ESFP", label: "ESFP" },
  ];

  const VisibilityOptions = [
    { value: "Show", label: "Show" },
    { value: "Hide", label: "Hide" },
  ];

  // Availability options builder (same pattern as CreateProfile)
  const generateHourlySlots = (day) => {
    const slots = [];
    for (let hour = 8; hour < 21; hour++) {
      const start = String(hour).padStart(2, '0') + ':00';
      const end = String(hour + 1).padStart(2, '0') + ':00';

      const formatHour = (h) => {
        const suffix = h >= 12 ? 'pm' : 'am';
        const display = ((h + 11) % 12 + 1);
        return `${display}${suffix}`;
      };

      const label = `${day} ${formatHour(hour)}-${formatHour(hour + 1)}`;

      slots.push({
        value: { day_of_week: day, start_time: start, end_time: end },
        label,
      });
    }
    return slots;
  };

  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const availabilityOptions = days.flatMap(generateHourlySlots);

  const pickSingle = (options, value) => options.find(o => o.value === value) || null;

  // Fetch all interests (for options)
  useEffect(() => {
    const fetchInterests = async () => {
      try {
        const response = await handleGetAllInterests();
        const interestArray = Array.isArray(response?.data) ? response.data : (Array.isArray(response) ? response : []);
        const formatted = interestArray.map(i => ({
          value: i.id,
          label: i.interest_name
        }));
        setAllInterests(formatted);
      } catch (err) {
        console.error('Failed to fetch interests:', err);
      }
    };
    fetchInterests();
  }, []);

  // Fetch profile core fields
  useEffect(() => {
    if (!id) return;

    const fetchProfile = async () => {
      try {
        const res = await handleGetUserProfileApi(id);
        const profile = res?.data?.data ?? res?.data ?? res;

        if (profile) {
          setNativeLanguage(profile.native_language ?? '');
          setTargetLanguage(profile.target_language ?? '');
          setTargetLanguageProficiency(profile.target_language_proficiency ?? '');
          setAge(profile.age ?? '');
          setGender(profile.gender ?? '');
          setProfession(profile.profession ?? '');
          setMBTI(profile.mbti ?? '');
          setZodiac(profile.zodiac ?? '');
          setDefaultTimeZone(profile.default_time_zone ?? '');
          setVisibility(profile.visibility ?? '');
        }
      } catch (err) {
        console.error('Failed to fetch user profile:', err);
      }
    };

    fetchProfile();
  }, [id]);

  // Fetch user interests and preload selections
  useEffect(() => {
    if (!id) return;

    const fetchUserInterests = async () => {
      try {
        const res = await handleGetUserInterests(id);
        const interestArray = Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : []);
        const formatted = interestArray.map(i => ({
          value: i.id,
          label: i.interest_name
        }));
        setSelectedInterests(formatted);
      } catch (err) {
        console.error('Failed to fetch user interests:', err);
      }
    };

    fetchUserInterests();
  }, [id]);

  // Fetch user availability and preload selections
  useEffect(() => {
    if (!id) return;

    const fetchAvailability = async () => {
      try {
        const res = await handleGetUserAvailability(id);
        const slots = Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : []);

        const mapped = slots.map(s => {
          const day = s.day_of_week;
          const start = s.start_time;
          const end = s.end_time;

          const match = availabilityOptions.find(o =>
            o.value.day_of_week === day &&
            o.value.start_time === start &&
            o.value.end_time === end
          );

          return match || {
            value: { day_of_week: day, start_time: start, end_time: end },
            label: `${day} ${start}-${end}`
          };
        });

        setAvailability(mapped);
      } catch (err) {
        console.error('Failed to fetch user availability:', err);
      }
    };

    fetchAvailability();
  }, [id]); // availabilityOptions is stable enough for this use case

  // Handlers
  const handleNativeLanguage = (selectedOption) => setNativeLanguage(selectedOption?.value ?? '');
  const handleTargetLanguage = (selectedOption) => setTargetLanguage(selectedOption?.value ?? '');
  const handleTargetLanguageProficiency = (selectedOption) => setTargetLanguageProficiency(selectedOption?.value ?? '');
  const handleAge = (e) => setAge(e.target.value);
  const handleGender = (selectedOption) => setGender(selectedOption?.value ?? '');
  const handleProfession = (selectedOption) => setProfession(selectedOption?.value ?? '');
  const handleZodiac = (selectedOption) => setZodiac(selectedOption?.value ?? '');
  const handleMBTI = (selectedOption) => setMBTI(selectedOption?.value ?? '');
  const handleInterestsChange = (selectedOptions) => setSelectedInterests(selectedOptions || []);
  const handleDefaultTimeZone = (selectedOption) => setDefaultTimeZone(selectedOption?.value ?? '');
  const handleAvailability = (selectedOptions) => setAvailability(selectedOptions || []);
  const handleVisibility = (selectedOption) => setVisibility(selectedOption?.value ?? '');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrMsg('');

    if (
      nativeLanguage === '' ||
      targetLanguage === '' ||
      targetLanguageProficiency === '' ||
      age === '' ||
      profession === ''
    ) {
      setError(true);
      return;
    }

    setSubmitted(true);
    setError(false);

    try {
      await handleProfileUpdateAPI(
        id,
        nativeLanguage,
        targetLanguage,
        targetLanguageProficiency,
        age,
        gender,
        profession,
        mbti,
        zodiac,
        defaultTimeZone,
        visibility
      );

      // Replace interests to reflect edits (including clearing)
      const interestIds = selectedInterests.map(i => i.value);
      await handleReplaceUserInterests(id, interestIds);

      // Replace availability to reflect edits (including clearing)
      const slots = availability.map(a => a.value);
      await handleReplaceUserAvailability(id, slots);

      navigate({
        pathname: "/Dashboard",
        search: createSearchParams({ id }).toString()
      });
    } catch (err) {
      if (err?.response?.data?.message) {
        setErrMsg(err.response.data.message);
      } else {
        setErrMsg("Failed to update profile.");
      }
      console.error(err);
    }
  };

  const handleBack = (e) => {
    e.preventDefault();
    navigate({
      pathname: "/Dashboard",
      search: createSearchParams({ id }).toString()
    });
  };

  const successMessage = () => (
    <div
      className="success"
      style={{ display: submitted ? '' : 'none' }}
    >
      <h1> Updated</h1>
    </div>
  );

  const errorMessage = () => (
    <div
      className="error"
      style={{ display: error ? '' : 'none' }}
    >
      <h1>enter required fields</h1>
    </div>
  );

  return (
    <div className="set-profile-wrapper">
      <div className="set-profile-card">

        <h1>Set Profile</h1>
        <h6>(* indicates required fields)</h6>

        <div className="messages">
          {errorMessage()}
          {successMessage()}
          {errMsg ? <div className="error"><h1>{errMsg}</h1></div> : null}
        </div>

        <form className="set-profile-form">

          <div className='form-group'>
            <label className="label">Native Language*</label>
            <Select
              options={NativeLanguage}
              onChange={handleNativeLanguage}
              value={pickSingle(NativeLanguage, nativeLanguage)}
            />
          </div>

          <div className='form-group'>
            <label className="label">Target Language*</label>
            <Select
              options={TargetLanguage}
              onChange={handleTargetLanguage}
              value={pickSingle(TargetLanguage, targetLanguage)}
            />
          </div>

          <div className='form-group'>
            <label className="label">Level of Target Language*</label>
            <Select
              options={TargetLanguageProficiency}
              onChange={handleTargetLanguageProficiency}
              value={pickSingle(TargetLanguageProficiency, targetLanguageProficiency)}
            />
          </div>

          <div className='form-group'>
            <label className="label">Age*</label>
            <input
              placeholder="Enter Age"
              onChange={handleAge}
              className="input"
              type="text"
              value={age}
            />
          </div>

          <div className='form-group'>
            <label className="label">Gender</label>
            <Select
              options={Gender}
              onChange={handleGender}
              value={pickSingle(Gender, gender)}
            />
          </div>

          <div className='form-group'>
            <label className="label">Profession*</label>
            <Select
              options={Profession}
              onChange={handleProfession}
              value={pickSingle(Profession, profession)}
            />
          </div>

          <div className='form-group'>
            <label className="label">Personality Type</label>
            <Select
              options={MBTI}
              onChange={handleMBTI}
              value={pickSingle(MBTI, mbti)}
            />
          </div>

          <div className='form-group'>
            <label className="label">Zodiac</label>
            <Select
              options={Zodiac}
              onChange={handleZodiac}
              value={pickSingle(Zodiac, zodiac)}
            />
          </div>

          <div className='form-group'>
            <label className="label">Interests</label>
            <Select
              isMulti
              options={allInterests}
              onChange={handleInterestsChange}
              value={selectedInterests}
            />
          </div>

          <div className='form-group'>
            <label className="label">Default Time Zone</label>
            <Select
              options={TimeZones}
              onChange={handleDefaultTimeZone}
              value={pickSingle(TimeZones, defaultTimeZone)}
            />
          </div>

          <div className='form-group'>
            <label className="label">Availability</label>
            <Select
              isMulti
              options={availabilityOptions}
              value={availability}
              onChange={handleAvailability}
            />
          </div>

          <div className='form-group'>
            <label className="label">Visibility</label>
            <Select
              options={VisibilityOptions}
              onChange={handleVisibility}
              value={pickSingle(VisibilityOptions, visibility)}
            />
          </div>

          <div className="profile-buttons">
            <button
              className="btn-back-02"
              type="button"
              onClick={handleSubmit}
            >
              Update Profile
            </button>
            <button
              className="btn-back-02"
              type="button"
              onClick={handleBack}
            >
              Back
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}

export default UpdateProfile;
