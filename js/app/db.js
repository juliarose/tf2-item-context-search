const db = new Dexie('trade_links');

db.version(1).stores({
    links: [
        '++id',
        'title',
        'url'
    ].join(',')
});

db.version(2).stores({
    links: [
        '++id',
        'title',
        'url'
    ].join(','),
    files: [
        '++id',
        'source_url',
        'filename',
        'last_fetched',
        'last_updated',
        'blob'
    ].join(',')
});

export { db };
