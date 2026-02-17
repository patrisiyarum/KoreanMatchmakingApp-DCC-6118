import { useState } from 'react';
import './Login.scss';
import {handleLoginApi} from '../Services/userService';
import { createSearchParams, useNavigate, useSearchParams } from "react-router-dom";
import { FiEye, FiEyeOff } from 'react-icons/fi';

function Login (){
    let data;
     const [username, setUsername] = useState('');
     const [password, setPassword] = useState('');
     const [showPassword, setShowPassword] = useState(false);
     const navigate = useNavigate();
     const [errMsg ,setErrMsg] = useState('');

      // States for checking the errors
      const [submitted, setSubmitted] = useState(false);
      const [error, setError] = useState(false);


    const handleOnChangeUserInput = (event) => {
        setUsername(event.target.value);
        setSubmitted(false);
    }

    const handleOnChangePassword = (event) => {
       setPassword(event.target.value);
       setSubmitted(false);
    }

    const handleBack = () => {
        navigate({
          pathname: "/register", // Navigate to Registration page
        });
      };

//    const [search] = useSearchParams();
//    const id = search.get("id");
//    console.log(id)

    
    const handleOnClick = async() => {
        setErrMsg("");

        try{
            data = await handleLoginApi(username, password);
            console.log("check >>>>" , data.errorCode);
            if (data && data.errCode !== 0){
            setErrMsg(data.message);
            }
            if (data.errorCode == 0){
            console.log("I am")
            // todo when login successful!
            navigate({
                    pathname: "/Dashboard",
                    search: createSearchParams({
                        id: data.id
                    }).toString()
                });
            }
        }catch(error){
            if (error.response){
                if (error.response.data){
                    this.setState({
                        errMessage: error.response.data.message
                    })

                }
            }
        }
    }

    return (
        <div className="login-background">
          <div className="visual-section">
            {/* Add optional branding or visuals here */}
            Welcome Back!
          </div>
          <div className="login-container">
            <div className="login-content">
              <div className="text-login"><h1>Login</h1></div>
              <div className="login-input">
                <label>Email:</label>
                <input
                  placeholder="Enter your email"
                  value={username}
                  onChange={handleOnChangeUserInput}
                />
                </div>
                <div className="login-input">
                  <label htmlFor="password" className="field-label">Password:</label>

                  <div className="password-field">
                    <input
                      id="password"
                      name="password"
                      className="field-input"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      value={password}
                      onChange={handleOnChangePassword}
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      className="toggle-password-btn"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                      onClick={() => setShowPassword((s) => !s)}
                      title={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                    </button>
                  </div>
                </div>
              <div className="error-message">{errMsg}</div>
              <button className="btn-login" onClick={handleOnClick}>
                Login
              </button>
              <div
                className="register"
                style={{
                    color: "black",
                    cursor: "pointer",
                    fontWeight: "normal",
                    transition: "color 0.3s ease",
                }}
                onClick={handleBack}
                onMouseEnter={(e) => (e.target.style.color = "#6344A6")}
                onMouseLeave={(e) => (e.target.style.color = "black")}
                >
                Don't have an account? Register!
              </div>
            </div>
          </div>
        </div>
      );
      

}

export default Login;
