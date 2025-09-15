// src/Pages/Evaluation/DataSets/DatasetsPage.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import styles from "./DatasetsPage.module.css";
import DatasetsTable from "./components/DatasetsTable";
import DatasetsEmpty from "./components/DatasetsEmpty";
import CreateDatasetModal from "./components/CreateDatasetModal";
import DatasetDetail from "./components/DatasetDetail";
import DeleteDatasetModal from "./components/DeleteDatasetModal";
import { getDatasets, createDataset, deleteDatasetHard, listDatasetItems, createDatasetItems } from "./datasetsApi";

// 편집 모달 초기값
function toInitialFromDataset(ds) {
  if (!ds) return undefined;
  const { name, description, metadata } = ds || {};
  const metaRaw =
    metadata == null
      ? ""
      : typeof metadata === "string"
        ? JSON.stringify(metadata)
        : typeof metadata === "number"
          ? String(metadata)
          : (() => {
            try { return JSON.stringify(metadata, null, 2); }
            catch { return ""; }
          })();

  return { name: name ?? "", description: description ?? "", metadata: metaRaw };
}

export default function DatasetsPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [openCreate, setOpenCreate] = useState(false);
  const [selected, setSelected] = useState(null);
  const [editing, setEditing] = useState(null);
  const [editingOriginalName, setEditingOriginalName] = useState(null);
  const [deleting, setDeleting] = useState(null);

  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const isNewPath = location.pathname.endsWith("/datasets/new");
    const params = new URLSearchParams(location.search);
    const isNewQuery = params.get("new") === "1";
    const isNewHash = location.hash.replace("#", "") === "new";
    if (isNewPath || isNewQuery || isNewHash) {
      setEditing(null);
      setEditingOriginalName(null);
      setOpenCreate(true);
    }
  }, [location.pathname, location.search, location.hash]);

  const fetchList = async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await getDatasets();
      setRows(Array.isArray(list) ? list : []);
      return list;
    } catch (e) {
      setError(e?.message ?? String(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchList(); }, []);

  const existingNames = useMemo(() => {
    const all = rows.map((d) => d.name);
    return editingOriginalName ? all.filter((n) => n !== editingOriginalName) : all;
  }, [rows, editingOriginalName]);

  const closeModal = () => {
    setOpenCreate(false);
    setEditing(null);
    setEditingOriginalName(null);
    if (location.pathname.endsWith("/datasets/new") || location.search.includes("new=1") || location.hash === "#new") {
      navigate("/datasets", { replace: true });
    }
  };

  const handleEdit = (dataset) => {
    setEditing(dataset);
    setEditingOriginalName(dataset.name);
    setOpenCreate(true);
  };

  const handleDuplicate = async (dataset) => {
    if (window.confirm(`Are you sure you want to duplicate this dataset "${dataset.name}"?`)) {
      try {
        const newName = `${dataset.name}-copy`;
        const items = await listDatasetItems(dataset.name);
        await createDataset({ name: newName, description: dataset.description, metadata: dataset.metadata });
        if (items && items.length > 0) {
          await createDatasetItems(newName, items);
        }
        await fetchList();
        alert(`Dataset "${dataset.name}" duplicated as "${newName}".`);
      } catch (e) {
        alert(`Failed to duplicate dataset: ${e.message}`);
      }
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleting) return;
    try {
      await deleteDatasetHard(deleting.name);
      setDeleting(null);
      setSelected(null);
      await fetchList();
    } catch (e) {
      alert(`Failed to delete dataset: ${e.message}`);
    }
  };

  const handleSubmit = async (form) => {
    const payload = {
      name: form.name,
      description: form.description || undefined,
      metadata: (() => {
        try {
          if (!form.metadata) return undefined;
          if (/^-?\d+(\.\d+)?$/.test(form.metadata.trim())) {
            return parseFloat(form.metadata.trim());
          }
          return JSON.parse(form.metadata);
        } catch { return form.metadata; }
      })(),
    };

    try {
      if (editing && editingOriginalName) {
        // --- 👇 수정 로직 최종 수정 ---
        // 1. 기존 데이터셋의 모든 아이템을 가져옵니다.
        const itemsToPreserve = await listDatasetItems(editingOriginalName);

        // 2. 기존 데이터셋을 삭제합니다.
        await deleteDatasetHard(editingOriginalName);

        // 3. 수정된 내용으로 새 데이터셋을 생성합니다.
        await createDataset(payload);

        // 4. 보존했던 아이템들을 새 데이터셋에 다시 추가합니다.
        if (itemsToPreserve && itemsToPreserve.length > 0) {
          await createDatasetItems(payload.name, itemsToPreserve);
        }
      } else {
        // 신규 생성
        await createDataset(payload);
      }

      closeModal();
      const updatedList = await fetchList();

      // 수정 후, 상세 뷰를 보고 있었다면 해당 아이템을 다시 선택합니다.
      if (selected) {
        const updatedSelected = updatedList.find(item => item.name === payload.name);
        if (updatedSelected) {
          setSelected(updatedSelected);
        } else {
          setSelected(null); // 삭제되었거나 이름이 바뀌어 찾을 수 없으면 목록으로 돌아갑니다.
        }
      }

    } catch (e) {
      console.error(e);
      alert(e?.message ?? "Failed to save dataset.");
      await fetchList(); // 오류 발생 시 목록을 다시 불러와 데이터 일관성 유지
    }
  };

  if (error) return <div className={styles.alertError} role="alert">{error}</div>;
  if (loading && rows.length === 0 && !openCreate) {
    return (
      <>
        <DatasetsEmpty onClickNew={() => setOpenCreate(true)} />
        <CreateDatasetModal open={openCreate} mode="create" initial={{}} existingNames={existingNames} onClose={closeModal} onSubmit={handleSubmit} />
      </>
    );
  }

  return (
    <div className={styles.page}>
      {selected ? (
        <DatasetDetail
          key={selected.name}
          dataset={selected}
          onBack={() => setSelected(null)}
          onEdit={() => handleEdit(selected)}
          onDuplicate={() => handleDuplicate(selected)}
          onDelete={() => setDeleting(selected)}
        />
      ) : rows.length > 0 ? (
        <DatasetsTable
          rows={rows}
          onRowClick={(row) => setSelected(row)}
          onEditRow={(row) => handleEdit(row)}
          onDeleteRow={(row) => setDeleting(row)}
        />
      ) : (
        <DatasetsEmpty onClickNew={() => setOpenCreate(true)} />
      )}

      <CreateDatasetModal
        open={openCreate}
        mode={editing ? "edit" : "create"}
        initial={toInitialFromDataset(editing)}
        existingNames={existingNames}
        onClose={closeModal}
        onSubmit={handleSubmit}
      />
      <DeleteDatasetModal
        isOpen={!!deleting}
        onClose={() => setDeleting(null)}
        datasetName={deleting?.name || ""}
        onDeleteConfirm={handleDeleteConfirm}
      />
    </div>
  );
};