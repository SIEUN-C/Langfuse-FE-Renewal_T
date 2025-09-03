import React, {useState, useRef, useCallback, useMemo, useEffect} from 'react'
import { useOutletContext } from "react-router-dom";
import {Plus, Trash2} from 'lucide-react';
import commonStyles from './layout/SettingsCommon.module.css'
import gridStyles from './layout/SettingsGrid.module.css'
import styles from './layout/Members.module.css'
import CustomPagination from "./CustomPagination";
import ColumnMenu from "../../layouts/ColumnMenu";
import NewMemberModal from './form/NewMemberModal.jsx'
import NewMemberForm from './form/NewMemberForm'
import useMembers from "./lib/useMembers";
import useMemberInvites from "./lib/useMemberInvites";

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
    const { items, meta, loading, error, updateRole, remove, setPage, setLimit, reload } = useMembers(projectId);
    const { items: invites, meta: invitesMeta, loading: invitesLoading, sendInvite, setPage: setInvPage, setLimit: setInvLimit, reload: reloadInvites } = useMemberInvites(projectId);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const [isColumnMenuOpen, setIsColumnMenuOpen] = useState(false);
    const columnButtonRef = useRef(null);

    // 컬럼 가시성 상태
    const [columnVisibility, setColumnVisibility] = useState(() => {
        const initialVisibility = {};
        COLUMN_DEFINITIONS.forEach(col => {
            if (col.field) {
                initialVisibility[col.field] = !col.initialHide;
            }
        });
        return initialVisibility;
    });

    const toggleColumnVisibility = (field) => {
        const columnDef = COLUMN_DEFINITIONS.find(c => c.field === field);
        if (columnDef?.lockVisible) {
            return;
        }
        setColumnVisibility(prev => ({ ...prev, [field]: !prev[field] }));
    };

    const toggleAllColumns = (select) => {
        const newVisibility = { ...columnVisibility };
        COLUMN_DEFINITIONS.forEach(col => {
            if (!col.lockVisible) {
                newVisibility[col.field] = select;
            }
        });
        setColumnVisibility(newVisibility);
    };

    const visibleColumnCount = useMemo(() => {
        return Object.values(columnVisibility).filter(isVisible => isVisible).length;
    }, [columnVisibility]);

    const mandatoryFields = useMemo(() =>
        COLUMN_DEFINITIONS.filter(c => c.lockVisible).map(c => c.field),
    []);

    const columnDisplayNames = useMemo(() =>
        COLUMN_DEFINITIONS.reduce((acc, col) => {
            if (col.field) {
                acc[col.field] = col.headerName;
            }
            return acc;
        }, {}),
    []);

    return (
        <div className={commonStyles.container}>
            <h3 className={commonStyles.title}>Project Members</h3>
            
            {/* 헤더 버튼들 */}
            <div className={gridStyles.header}>
                <div ref={columnButtonRef} onClick={() => setIsColumnMenuOpen(prev => !prev)}>
                    <button
                        className={`${gridStyles.headerButton} ${gridStyles.columnsButton}`}
                    >
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
                                            <select 
                                                value={member.organizationRole} 
                                                className={styles.roleSelect}
                                                onChange={(e) => updateRole(member.id, e.target.value)}
                                            >
                                                <option value="Owner">Owner</option>
                                                <option value="Admin">Admin</option>
                                                <option value="Member">Member</option>
                                                <option value="Viewer">Viewer</option>
                                                <option value="None">None</option>
                                            </select>
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
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </td>
                                )}
                            </tr>
                        ))}
                        {(!items || items.length === 0) && (
                            <tr>
                                <td colSpan={Object.values(columnVisibility).filter(Boolean).length} className={styles.empty}>
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
                        try{
                            await sendInvite({ email, orgRole: role, projectRole: null });
                            await reloadInvites();
                            setIsModalOpen(false);
                            alert("초대장이 발송되었습니다.");
                        }catch (error){
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
                                    <button className={styles.actionButton} disabled title="Cancel not implemented">
                                        <Trash2 size={16} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {(!invites || invites.length === 0) && (
                            <tr><td colSpan={6} className={styles.empty}>No pending invitations</td></tr>
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