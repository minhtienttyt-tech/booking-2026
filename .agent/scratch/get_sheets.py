import json
with open('.agent/scratch/excel_structure.json', 'r', encoding='utf-8') as f:
    data = json.load(f)
with open('.agent/scratch/sheet_names.txt', 'w', encoding='utf-8') as f:
    f.write('\n'.join(data.keys()))
