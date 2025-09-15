// src/Pages/Evaluation/DataSets/components/ImportCsvView.jsx
import React, { useState, useEffect } from "react";
import { DragDropContext, Draggable } from "react-beautiful-dnd";
import { StrictDroppable } from "./StrictDroppable"; // 👈 Droppable 대신 StrictDroppable을 import
import styles from "../importCsvView.module.css";
import sharedStyles from "../datasetsShared.module.css";
import { Info } from "lucide-react";

// (헬퍼 함수 move는 이전과 동일)
const move = (source, destination, droppableSource, droppableDestination) => {
    const sourceClone = Array.from(source);
    const destClone = Array.from(destination);
    const [removed] = sourceClone.splice(droppableSource.index, 1);
    destClone.splice(droppableDestination.index, 0, removed);
    const result = {};
    result[droppableSource.droppableId] = sourceClone;
    result[droppableDestination.droppableId] = destClone;
    return result;
};

export default function ImportCsvView({ csvData, onCancel, onImport }) {
    const { headers, rows, fileName } = csvData;

    const [columns, setColumns] = useState({
        input: [],
        expectedOutput: [],
        metadata: [],
        unmapped: [],
    });

    useEffect(() => {
        if (!headers || headers.length === 0) return;
        const initialColumns = { input: [], expectedOutput: [], metadata: [], unmapped: [] };
        const mappedHeaders = new Set();

        const guessAndAssign = (key, keywords) => {
            const header = headers.find(h => !mappedHeaders.has(h) && keywords.includes(h.toLowerCase().replace(/[\s_-]/g, "")));
            if (header) {
                initialColumns[key].push({ id: header, content: header });
                mappedHeaders.add(header);
            }
        };

        guessAndAssign('input', ["input", "prompt", "question", "userquery", "text"]);
        guessAndAssign('expectedOutput', ["expected", "output", "answer", "label", "expectedresponse", "expectedoutput"]);
        guessAndAssign('metadata', ["metadata", "meta", "tags"]);

        headers.forEach(header => {
            if (!mappedHeaders.has(header)) {
                initialColumns.unmapped.push({ id: header, content: header });
            }
        });
        setColumns(initialColumns);
    }, [headers]);

    function onDragEnd(result) {
        const { source, destination } = result;
        if (!destination) return;

        if (source.droppableId !== destination.droppableId) {
            const sourceCol = columns[source.droppableId];
            const destCol = columns[destination.droppableId];
            const movedResult = move(sourceCol, destCol, source, destination);
            setColumns(prev => ({ ...prev, ...movedResult }));
        }
    }

    const handleImport = () => {
        const items = rows.map(row => {
            const item = {};
            const findValue = (key) => {
                const headerItem = columns[key][0];
                if (!headerItem) return undefined;
                const idx = headers.indexOf(headerItem.content);
                return idx > -1 ? row[idx] : undefined;
            };
            item.input = findValue('input');
            item.expectedOutput = findValue('expectedOutput');
            item.metadata = findValue('metadata');
            return item;
        });
        onImport(items);
    };

    const columnDefs = {
        input: { title: "Input" },
        expectedOutput: { title: "Expected Output" },
        metadata: { title: "Metadata" },
        unmapped: { title: "Not mapped" },
    };

    return (
        <div className={styles.importViewContainer}>
            <div className={styles.importViewHeader}>
                <h3 className={styles.importViewTitle}>Import {fileName}</h3>
                <p className={styles.importViewDescription}>
                    Map your CSV columns to dataset fields. The CSV file must have column headers in the first row.
                </p>
            </div>

            <DragDropContext onDragEnd={onDragEnd}>
                <div className={styles.importViewGrid}>
                    {Object.entries(columnDefs).map(([key, { title }]) => (
                        // 👇 Droppable을 StrictDroppable로 교체
                        <StrictDroppable key={key} droppableId={key}>
                            {(provided, snapshot) => (
                                <div
                                    ref={provided.innerRef}
                                    {...provided.droppableProps}
                                    className={`${styles.importViewCard} ${snapshot.isDraggingOver ? styles.isDraggingOver : ''}`}
                                >
                                    <h4 className={styles.importViewCardTitle}>
                                        {title}
                                        {key === 'unmapped' && <Info size={14} />}
                                    </h4>
                                    <div className={styles.importViewCardContent}>
                                        {columns[key].map((item, index) => (
                                            <Draggable key={item.id} draggableId={item.id} index={index}>
                                                {(provided, snapshot) => (
                                                    <div
                                                        ref={provided.innerRef}
                                                        {...provided.draggableProps}
                                                        {...provided.dragHandleProps}
                                                        className={`${styles.columnTag} ${snapshot.isDragging ? styles.isDragging : ''}`}
                                                    >
                                                        <span className={styles.columnTagName}>{item.content}</span>
                                                        <span className={styles.columnTagType}>string</span>
                                                    </div>
                                                )}
                                            </Draggable>
                                        ))}
                                        {provided.placeholder}
                                    </div>
                                </div>
                            )}
                        </StrictDroppable>
                    ))}
                </div>
            </DragDropContext>

            <div className={styles.importViewFooter}>
                <button className={sharedStyles.secondaryBtn} onClick={onCancel}>
                    Cancel
                </button>
                <button className={sharedStyles.primaryBtn} onClick={handleImport}>
                    Import
                </button>
            </div>
        </div>
    );
};