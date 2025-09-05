import React from "react";
import styles from "./Templates.module.css"; // CSS 모듈도 새로 만듭니다.

// selectedTemplate: 선택된 행의 데이터
// onClose: 패널을 닫기 위해 부모로부터 전달받는 함수
const Templates = ({ selectedTemplate, onClose }) => {
  // selectedTemplate 데이터가 없으면 아무것도 렌더링하지 않습니다.
  if (!selectedTemplate) {
    return null;
  }

  return (
    // 패널의 배경(overlay)을 클릭해도 닫히도록 설정
    <div className={styles.overlay} onClick={onClose}>
      {/* 실제 패널 컨텐츠 부분. 클릭 이벤트가 부모로 전파되지 않도록 막습니다. */}
      <div className={styles.panel} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2>Template Details</h2>
          <button onClick={onClose} className={styles.closeButton}>
            &times; {/* 'x' 아이콘 */}
          </button>
        </div>
        <div className={styles.content}>
          <p>
            <strong>Name:</strong> {selectedTemplate.name}
          </p>
          <p>
            <strong>ID:</strong> {selectedTemplate.id}
          </p>
          <p>
            <strong>Partner:</strong> {selectedTemplate.partner}
          </p>
          {/* 여기에 나중에 API로 가져온 상세 정보를 추가할 수 있습니다. */}
        </div>
      </div>
    </div>
  );
};

export default Templates;