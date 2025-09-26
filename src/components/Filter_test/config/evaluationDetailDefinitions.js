export const evaluationDetailFilterDefs = [
    {
        name: "⭐️",
        id: "bookmarked",
        type: "boolean",
        internal: "t.bookmarked",
    },
    {
        name: "ID",
        id: "id",
        type: "string",
        internal: "t.id"
    },
    {
        name: "Name",
        id: "name",
        type: "stringOptions",
        internal: 't."name"',
        options: [], // 런타임에 채워짐
    },
    {
        name: "Environment",
        id: "environment",
        type: "stringOptions",
        internal: 't."environment"',
        options: [], // 런타임에 채워짐
    },
    {
        name: "Timestamp",
        id: "timestamp",
        type: "datetime",
        internal: 't."timestamp"',
    },
    {
        name: "User ID",
        id: "userId",
        type: "string",
        internal: 't."user_id"',
    },
    {
        name: "Session ID",
        id: "sessionId",
        type: "string",
        internal: 't."session_id"',
    },
    {
        name: "Metadata",
        id: "metadata",
        type: "stringObject",
        internal: 't."metadata"',
    },
    {
        name: "Version",
        id: "version",
        type: "string",
        internal: 't."version"',
    },
    {
        name: "Release",
        id: "release",
        type: "string",
        internal: 't."release"',
    },
    {
        name: "Level",
        id: "level",
        type: "stringOptions",
        internal: '"level"',
        options: [
            { value: "DEBUG" },
            { value: "DEFAULT" },
            { value: "WARNING" },
            { value: "ERROR" },
        ],
    },
    {
        name: "Tags",
        id: "tags",
        type: "arrayOptions",
        internal: 't."tags"',
        options: [], // 런타임에 채워짐
    },
];