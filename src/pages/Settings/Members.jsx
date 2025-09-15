import React, {useState, useRef, useMemo} from 'react';
import { useOutletContext } from "react-router-dom";
import {Plus, Trash2} from 'lucide-react';
import commonStyles from './layout/SettingsCommon.module.css';
import gridStyles from './layout/SettingsGrid.module.css';
import styles from './layout/Members.module.css';
import CustomPagination from "./CustomPagination.jsx";
import ColumnMenu from "../../layouts/ColumnMenu.jsx";
import NewMemberModal from './form/NewMemberModal.jsx';
import NewMemberForm from './form/NewMemberForm.jsx';
import useMembers from "./lib/useMembers.js";
import useMemberInvites from "./lib/useMemberInvites.js";
import RoleSelect from './form/RoleSelect.jsx';

const COLUMN_DEFINITIONS = [
  { field: 'name', headerName: 'Name', lockVisible: true },
  { field: 'email', headerName: 'Email', lockVisible: true },
  { field: 'organizationRole', headerName: 'Organization Role', lockVisible: true },
  { field: 'projectRole', headerName: 'Project Role', lockVisible: true },
  { field: 'memberSince', headerName: 'Member Since', initialHide: true },
  { field: 'actions', headerName: 'Actions', lockVisible: true },
];

const Members = () => {
  const { projectId } = useOutletContext();
  const { items, meta, updateRole, remove, setPage, setLimit } = useMembers(projectId);
  const {
    items: invites,
    meta: invitesMeta,
    sendInvite,
    setPage: setInvPage,
    setLimit: setInvLimit,
    reload: reloadInvites,
    cancelInvite,
  } = useMemberInvites(projectId);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [isColumnMenuOpen, setIsColumnMenuOpen] = useState(false);
  const columnButtonRef = useRef(null);

  // 컬럼 가시성 상태
  const [columnVisibility, setColumnVisibility] = useState(() => {
    const initialVisibility = {};
    COLUMN_DEFINITIONS.forEach(col => {
      if (col.field) initialVisibility[col.field] = !col.initialHide;
    });
    return initialVisibility;
  });

  const toggleColumnVisibility = (field) => {
    const columnDef = COLUMN_DEFINITIONS.find(c => c.field === field);
    if (columnDef?.lockVisible) return;
    setColumnVisibility(prev => ({ ...prev, [field]: !prev[field] }));
  };

  const toggleAllColumns = (select) => {
    const newVisibility = { ...columnVisibility };
    COLUMN_DEFINITIONS.forEach(col => {
      if (!col.lockVisible) newVisibility[col.field] = select;
    });
    setColumnVisibility(newVisibility);
  };

  const visibleColumnCount = useMemo(
    () => Object.values(columnVisibility).filter(Boolean).length,
    [columnVisibility]
  );

  const mandatoryFields = useMemo(
    () => COLUMN_DEFINITIONS.filter(c => c.lockVisible).map(c => c.field),
    []
  );

  const columnDisplayNames = useMemo(
    () => COLUMN_DEFINITIONS.reduce((acc, col) => {
      if (col.field) acc[col.field] = col.headerName;
      return acc;
    }, {}),
    []
  );

  return (
    <div className={commonStyles.container}>
      <h3 className={commonStyles.title}>Project Members</h3>

      {/* 헤더 버튼들 */}
      <div className={gridStyles.header}>
        <div ref={columnButtonRef} onClick={() => setIsColumnMenuOpen(prev => !prev)}>
          <button className={`${gridStyles.headerButton} ${gridStyles.columnsButton}`}>
            <span>Columns</span>
            <span className={gridStyles.count}>{visibleColumnCount}/{COLUMN_DEFINITIONS.length}</span>
          </button>
          <ColumnMenu
            isOpen={isColumnMenuOpen}
            onClose={() => setIsColumnMenuOpen(false)}
            anchorE1={columnButtonRef}
            columnVisibility={columnVisibility}
            toggleColumnVisibility={toggleColumnVisibility}
            displayNames={columnDisplayNames}
            mandatoryFields={mandatoryFields}
            onToggleAll={toggleAllColumns}
          />
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className={`${gridStyles.headerButton} ${gridStyles.addButton}`}
        >
          <Plus size={16} /> Add new member
        </button>
      </div>

      {/* Members Table */}
      <div className={styles.membersTable}>
        <table>
          <thead>
          <tr>
            {columnVisibility.name && <th>Name</th>}
            {columnVisibility.email && <th>Email</th>}
            {columnVisibility.organizationRole && <th>Organization Role</th>}
            {columnVisibility.projectRole && <th>Project Role</th>}
            {columnVisibility.memberSince && <th>Member Since</th>}
            {columnVisibility.actions && <th>Actions</th>}
          </tr>
          </thead>

          <tbody>
          {items.map((member) => (
            <tr key={member.id}>
              {columnVisibility.name && (
                <td>
                  <div className={styles.nameCell}>
                    <span>{member.name}</span>
                  </div>
                </td>
              )}
              {columnVisibility.email && <td>{member.email}</td>}

              {columnVisibility.organizationRole && (
                <td>
                  <div className={styles.roleCell}>
                    {/* ✅ 코드값(OWNER/ADMIN/MEMBER/VIEWER/NONE) 그대로 전달 */}
                    <RoleSelect
                      value={String(member.organizationRole || "MEMBER").toUpperCase()}
                      onChange={(next) => updateRole(member.id, next)}
                    />
                  </div>
                </td>
              )}

              {columnVisibility.projectRole && <td>{member.projectRole || "N/A on plan"}</td>}
              {columnVisibility.memberSince && (
                <td>{new Date(member.memberSince).toLocaleDateString()}</td>
              )}

              {columnVisibility.actions && (
                <td>
                  <button
                    className={styles.actionButton}
                    onClick={() => remove(member.id)}
                    aria-label="remove member"
                  >
                    <Trash2 size={16} />
                  </button>
                </td>
              )}
            </tr>
          ))}

          {(!items || items.length === 0) && (
            <tr>
              <td
                colSpan={Object.values(columnVisibility).filter(Boolean).length}
                className={styles.empty}
              >
                No members found
              </td>
            </tr>
          )}
          </tbody>
        </table>

        {/* Pagination for Members */}
        {meta && (
          <CustomPagination
            pageSizes={[10, 20, 30, 40, 50]}
            currentPage={meta.page}
            totalPages={meta.totalPages}
            totalItems={meta.totalItems}
            onPageChange={(page) => setPage(page)}
            onLimitChange={(limit) => { setLimit(limit); setPage(1); }}
          />
        )}
      </div>

      {/* Modal */}
      <NewMemberModal
        title="Add new member to the organization"
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      >
        <NewMemberForm
          onInvite={async (email, role) => {
            try {
              await sendInvite({ email, orgRole: role, projectRole: null });
              await reloadInvites();
              setIsModalOpen(false);
              alert("초대장이 발송되었습니다.");
            } catch (error) {
              alert(`초대장 발송에 실패했습니다: ${error.message}`);
            }
          }}
          onClose={() => setIsModalOpen(false)}
        />
      </NewMemberModal>

      {/* Membership Invites */}
      <h3 className={commonStyles.subtitle}>Membership Invites</h3>
      <div className={styles.invitesTable}>
        <table>
          <thead>
          <tr>
            <th>Email</th>
            <th>Organization Role</th>
            <th>Invited On</th>
            <th>Project Role</th>
            <th>Invited By</th>
            <th>Actions</th>
          </tr>
          </thead>
          <tbody>
          {invites.map((invite) => (
            <tr key={invite.id}>
              <td>{invite.email}</td>
              <td>{invite.organizationRole}</td>
              <td>{new Date(invite.invitedOn).toLocaleString()}</td>
              <td>{invite.projectRole ?? "—"}</td>
              <td>{invite.invitedByName || "—"}</td>
              <td>
                {/* ✅ 초대 취소 동작 연결 */}
                <button
                  className={styles.actionButton}
                  onClick={async () => {
                    if (!confirm("이 초대를 취소할까요?")) return;
                    try {
                      await cancelInvite(invite.id);
                      alert("초대를 취소했어요.");
                    } catch (e) {
                      alert(`취소 실패: ${e?.message || "알 수 없는 오류"}`);
                    }
                  }}
                  aria-label="cancel invitation"
                >
                  <Trash2 size={16} />
                </button>
              </td>
            </tr>
          ))}
          {(!invites || invites.length === 0) && (
            <tr>
              <td colSpan={6} className={styles.empty}>No pending invitations</td>
            </tr>
          )}
          </tbody>
        </table>

        <CustomPagination
          pageSizes={[10, 20, 30, 40, 50]}
          currentPage={invitesMeta.page}
          totalPages={invitesMeta.totalPages}
          totalItems={invitesMeta.totalItems}
          onPageChange={(p) => setInvPage(p)}
          onLimitChange={(l) => { setInvLimit(l); setInvPage(1); }}
        />
      </div>
    </div>
  );
};

export default Members;
