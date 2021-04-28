// generates an id for a context
export default function getContextId(...items) {
    return [
        'trade-search-links',
        ...items
    ].join('-');
}
