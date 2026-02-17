import React, { useState } from "react";
import "./Registration.css";
import "./Dashboard.css";
import "./Translator.css";
import Button from "react-bootstrap/Button";
import { createSearchParams, useSearchParams, useNavigate } from "react-router-dom";
import translate from "translate";
import { handleTranslator } from "../Services/userService";

function Translator() {
  const [search] = useSearchParams();
  const navigate = useNavigate();
  const id = search.get("id");

  const [inputText, setInputText] = useState("");
  const [translatedText, setTranslatedText] = useState("");

  const translateButton = async () => {
    try {
      const text = await translate(inputText, { to: "ko", from: "en" });
      setTranslatedText(text);
    } catch (err) {
      console.error("Translation error:", err);
    }
  };

  const saveButton = async () => {
    try {
      // original -> EN and KO versions
      const textEn = await translate(inputText, { to: "en", from: "ko" });
      const textKo = await translate(inputText, { to: "ko", from: "en" });
      await handleTranslator(textEn, textKo);
    } catch (err) {
      console.error("Save translation error:", err);
    }
  };

  const onClear = () => {
    setInputText("");
    setTranslatedText("");
  };

  const handleBack = () => {
    navigate({
      pathname: "/Dashboard",
      search: createSearchParams({ id }).toString(),
    });
  };

  return (
    <div className="screen-Background">
      <div className="screen-Container translator-container">
        <div className="screen-Content translator-content">
          <h1 className="translator-title">Translator</h1>

          {/* Two side-by-side boxes */}
          <div className="translator-panel">
            <div className="translator-column">
              <div className="translator-label">Enter text</div>
              <textarea
                className="translator-box"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Type text here..."
              />
            </div>

            <div className="translator-column">
              <div className="translator-label">Translation</div>
              <textarea
                className="translator-box"
                value={translatedText}
                readOnly
                placeholder="Translation will appear here..."
              />
            </div>
          </div>

          {/* Buttons */}
          <div className="translator-controls">
            <Button className="translator-btn" variant="primary" onClick={translateButton}>
              Translate
            </Button>
            {/* <Button className="translator-btn" variant="success" onClick={saveButton}>
              Save Translation
            </Button> */}
            <Button className="translator-btn" variant="secondary" onClick={onClear}>
              Clear
            </Button>
            <Button className="translator-btn" variant="outline-dark" onClick={handleBack}>
              Back
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Translator;
