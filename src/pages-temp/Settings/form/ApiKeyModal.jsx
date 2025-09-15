import React, { useEffect, useMemo, useState } from "react";
import { Copy, X } from "lucide-react";
import apiKeyStyles from "../layout/Apikeys.module.css";

export default function ApiKeyModal({ host, newKeyDetails, codeSnippets = {}, onClose }) {
  const [activeTab, setActiveTab] = useState("Python");

  // 배경 스크롤 잠금
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => (document.body.style.overflow = prev || "");
  }, []);

  const tabs = useMemo(() => Object.keys(codeSnippets), [codeSnippets]);
  const currentCode = useMemo(() => codeSnippets[activeTab] || "", [codeSnippets, activeTab]);

  const copyToClipboard = (text) => text && navigator.clipboard.writeText(text).then(() => alert("복사되었습니다."));

  return (
    <div className={apiKeyStyles.modalOverlay} role="dialog" aria-modal="true">
      <div className={apiKeyStyles.modalContent}>
        <div className={apiKeyStyles.modalHeader}>
          <h2 className={apiKeyStyles.modalTitle}>API Keys</h2>
          <button onClick={onClose} className={apiKeyStyles.closeButton} aria-label="Close">
            <X size={20} />
          </button>
        </div>

        {/* 모달 내부 스크롤 영역 */}
        <div className={apiKeyStyles.modalBody}>
          <div className={apiKeyStyles.section}>
            <h3 className={apiKeyStyles.sectionTitle}>Secret Key</h3>
            <p className={apiKeyStyles.sectionDescription}>
              This key can only be viewed once. You can always create new keys in the project settings.
            </p>
            <div className={apiKeyStyles.inputWrapper}>
              <input value={newKeyDetails?.secretKey || ""} readOnly className={apiKeyStyles.input} />
              <button
                onClick={() => copyToClipboard(newKeyDetails?.secretKey)}
                className={apiKeyStyles.copyButtonInInput}
                aria-label="Copy secret key"
              >
                <Copy size={16} />
              </button>
            </div>
          </div>

          <div className={apiKeyStyles.section}>
            <h3 className={apiKeyStyles.sectionTitle}>Public Key</h3>
            <div className={apiKeyStyles.inputWrapper}>
              <input value={newKeyDetails?.publicKey || ""} readOnly className={apiKeyStyles.input} />
              <button
                onClick={() => copyToClipboard(newKeyDetails?.publicKey)}
                className={apiKeyStyles.copyButtonInInput}
                aria-label="Copy public key"
              >
                <Copy size={16} />
              </button>
            </div>
          </div>

          <div className={apiKeyStyles.section}>
            <h3 className={apiKeyStyles.sectionTitle}>Host</h3>
            <div className={apiKeyStyles.inputWrapper}>
              <input value={host || ""} readOnly className={apiKeyStyles.input} />
              <button
                onClick={() => copyToClipboard(host)}
                className={apiKeyStyles.copyButtonInInput}
                aria-label="Copy host"
              >
                <Copy size={16} />
              </button>
            </div>
          </div>

          <div className={apiKeyStyles.section}>
            <h3 className={apiKeyStyles.sectionTitle}>Usage</h3>

            {tabs.length > 0 && (
              <>
                <div className={apiKeyStyles.tabsContainer}>
                  {tabs.map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`${apiKeyStyles.tabButton} ${activeTab === tab ? apiKeyStyles.tabActive : ""}`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>

                <div className={apiKeyStyles.codeBlockWrapper}>
                  <pre className={apiKeyStyles.codeBlock}><code>{currentCode}</code></pre>
                  <button
                    onClick={() => copyToClipboard(currentCode)}
                    className={apiKeyStyles.copyButtonInCode}
                    aria-label="Copy code"
                  >
                    <Copy size={16} />
                  </button>
                </div>
              </>
            )}
          </div>

          <p className={apiKeyStyles.footerLinks}>
            See{" "}
            <a
              href="https://langfuse.com/docs/observability/get-started"
              target="_blank"
              rel="noopener noreferrer"
            >
              Quickstart
            </a>{" "}
            and{" "}
            <a
              href="https://langfuse.com/docs/observability/sdk/python/overview"
              target="_blank"
              rel="noopener noreferrer"
            >
              Python docs
            </a>{" "}
            for more details and an end-to-end example.
            <br />
            Do you have questions or issues? Check this{" "}
            <a
              href="https://langfuse.com/faq/all/missing-traces"
              target="_blank"
              rel="noopener noreferrer"
            >
              FAQ post
            </a>
            .{" "}
            <a
              href="https://langfuse.com/docs/ask-ai"
              target="_blank"
              rel="noopener noreferrer"
            >
              Ask AI
            </a>{" "}
            or{" "}
            <a
              href="https://langfuse.com/support"
              target="_blank"
              rel="noopener noreferrer"
            >
              get support
            </a>
            .
          </p>
        </div>
      </div>
    </div>
  );
}