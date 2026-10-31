import sqlite3, os, sys

DB_PATHS = [
    ('/opt/ttmcobuild/pb_data/data.db', 'ttmcobuild'),
    ('/opt/afterink/pb_data/data.db', 'afterink'),
    ('/opt/andrade_realstate/pb_data/data.db', 'andrade_realstate'),
]

for vol_name in ['tomyrioss_pocketbase_data', 'pocketbase_data']:
    out = os.popen(f'docker inspect {vol_name} --format "{{{{.Mountpoint}}}}" 2>/dev/null').read().strip()
    if out:
        DB_PATHS.append((os.path.join(out, 'data.db'), vol_name.replace('_pocketbase', '').replace('pocketbase_', '')))

OUTPUT_DIR = '/tmp/pb-dumps/sql'
os.makedirs(OUTPUT_DIR, exist_ok=True)

SYSTEM = set(['_authOrigins','_collections','_externalAuths','_mfas','_migrations','_otps','_params','_superusers'])
SQLITE = set(['sqlite_stat1','sqlite_stat4'])

for db_path, prefix in DB_PATHS:
    print('Processing {} : {}'.format(prefix, db_path), file=sys.stderr)
    if not os.path.exists(db_path):
        print('  SKIP: not found', file=sys.stderr)
        continue
    
    conn = sqlite3.connect(db_path)
    cur = conn.cursor()
    
    filename = '{}/{}.sql'.format(OUTPUT_DIR, prefix)
    with open(filename, 'w') as f:
        f.write('-- PocketBase dump: {}\n\n'.format(prefix))
        
        cur.execute("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")
        all_tables = [r[0] for r in cur.fetchall()]
        
        for table in sorted(all_tables):
            cur.execute("SELECT sql FROM sqlite_master WHERE name=?", (table,))
            row = cur.fetchone()
            if row and row[0]:
                f.write(row[0] + ';\n\n')
        
        user_tables = sorted([t for t in all_tables if t not in SYSTEM and t not in SQLITE])
        
        for table in user_tables:
            cols_rows = cur.execute('PRAGMA table_info({})'.format(table)).fetchall()
            if not cols_rows:
                continue
            cols = [r[1] for r in cols_rows]
            col_list = ', '.join(['[{}]'.format(c) for c in cols])
            
            cur.execute('SELECT * FROM {}'.format(table))
            rows = cur.fetchall()
            
            for row in rows:
                vals = []
                for val in row:
                    if val is None:
                        vals.append('NULL')
                    elif isinstance(val, str):
                        escaped = val.replace('\\', '\\\\').replace("'", "''").replace('\n', '\\n')
                        vals.append("'{}'".format(escaped))
                    else:
                        vals.append(str(val))
                values = ', '.join(vals)
                f.write('INSERT INTO [{}] ({}) VALUES ({});\n'.format(table, col_list, values))
            f.write('\n')
    
    print('  -> {}'.format(filename))
    conn.close()

print('All dumps generated!', file=sys.stderr)
