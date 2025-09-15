// src/Pages/Evaluation/DataSets/components/StrictDroppable.jsx
import React, { useEffect, useState } from "react";
import { Droppable } from "react-beautiful-dnd";

// React 18 StrictMode 호환성을 위한 Droppable 래퍼 컴포넌트
export const StrictDroppable = ({ children, ...props }) => {
    const [enabled, setEnabled] = useState(false);

    useEffect(() => {
        const animation = requestAnimationFrame(() => setEnabled(true));
        return () => {
            cancelAnimationFrame(animation);
            setEnabled(false);
        };
    }, []);

    if (!enabled) {
        return null;
    }

    return <Droppable {...props}>{children}</Droppable>;
};