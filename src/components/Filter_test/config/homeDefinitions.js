export const tracesFilterDefs = [
    {
        name: "Trace Name",
        id: "traceName",
        type: "stringOptions",
        internal: 't."name"',
        options: [], // to be added at runtime
        nullable: true,
    },
    {
        name: "Tags",
        id: "tags",
        type: "arrayOptions",
        internal: 't."tags"',
        options: [], // 런타임에 채워짐
    },
    {
        name: "User",
        id: "user",
        type: "string",
        internal: "internalValue",
    },
    {
        name: "Release",
        id: "release",
        type: "string",
        internal: 't."release"',
    },
    {
        name: "Version",
        id: "version",
        type: "string",
        internal: 't."version"',
    },
];