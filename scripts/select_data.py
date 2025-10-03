import csv

# not beautiful code but it works

def trim_float_str(val):
    try:
        if isinstance(val, str) and '.' in val:
            f = float(val)
            if f.is_integer():
                return f"{f:.1f}"
            else:
                return str(f)
        return val
    except Exception:
        return val

with open('data/toi_data.csv', 'r') as f:
    reader = csv.reader(f)
    for i, row in enumerate(reader):
        if i == 0:
            continue
        toi = "TOI-" + row[1]
        tid = row[3]
        disposition = 0 if row[6] == "FP" else 1
        pl_orbper = trim_float_str(row[14])
        pl_trandurh = trim_float_str(row[15])
        pl_trandep = trim_float_str(row[16])
        pl_rade = trim_float_str(row[17])
        pl_eqt = trim_float_str(row[19])


        with open('data/dataset.csv', 'a') as f:
            writer = csv.writer(f)
            writer.writerow(["tess",tid, toi, disposition, pl_orbper, pl_trandurh, pl_trandep, pl_rade, pl_eqt])

with open('data/koi_data.csv', 'r') as f:
    reader = csv.reader(f)
    idx_kepid = None
    idx_kepoi_name = None
    idx_koi_pdisposition = None
    idx_koi_period = None
    idx_koi_duration = None
    idx_koi_depth = None
    idx_koi_prad = None
    idx_koi_teq = None
    for i, row in enumerate(reader):

        if i == 0:
            header = row
            idx_kepid = header.index("kepid")
            idx_kepoi_name = header.index("kepoi_name")
            idx_koi_pdisposition = header.index("koi_pdisposition")
            idx_koi_period = header.index("koi_period")
            idx_koi_duration = header.index("koi_duration")
            idx_koi_depth = header.index("koi_depth")
            idx_koi_prad = header.index("koi_prad")
            idx_koi_teq = header.index("koi_teq")
            continue

        kepid = row[idx_kepid]
        kepoi_name = row[idx_kepoi_name]
        koi_pdisposition = row[idx_koi_pdisposition]
        koi_score = 1 if koi_pdisposition == "CANDIDATE" else 0
        koi_period = row[idx_koi_period]
        koi_duration = row[idx_koi_duration]
        koi_depth_str = row[idx_koi_depth]
        try:
            koi_depth = float(koi_depth_str)
        except (ValueError, TypeError):
            koi_depth = koi_depth_str 
        koi_prad = row[idx_koi_prad]
        koi_teq = row[idx_koi_teq]

        with open('data/dataset.csv', 'a') as f:
            writer = csv.writer(f)
            writer.writerow(["kepler", kepid, kepoi_name, koi_score, koi_period, koi_duration, koi_depth, koi_prad, koi_teq])

with open('data/k2_data.csv', 'r') as f:
    reader = csv.reader(f)
    idx_id = None
    idx_name = None
    idx_disposition = None
    idx_period  = None
    idx_duration = None
    idx_depth = None
    idx_prad = None
    idx_teq = None
    for i, row in enumerate(reader):

        if i == 0:
            # Save header indices   
            header = row
            idx_id = header.index("epic_hostname")
            idx_name = header.index("pl_name")
            idx_disposition = header.index("disposition")
            idx_period = header.index("pl_orbper")
            idx_duration = header.index("pl_trandur")
            idx_depth = header.index("pl_trandep")
            idx_prad = header.index("pl_rade")
            idx_teq = header.index("pl_eqt")
            continue

        try:
            k2_id = row[idx_id].split(" ")[1]
        except IndexError:
            continue
        k2_name = row[idx_name]
        k2_disposition = row[idx_disposition]
        k2_score = 0 if k2_disposition == "FALSE POSITIVE" else 1
        k2_period = trim_float_str(row[idx_period])
        k2_duration = trim_float_str(row[idx_duration])
        k2_depth = trim_float_str(row[idx_depth])
        k2_prad = trim_float_str(row[idx_prad])
        k2_teq = row[idx_teq]

        # If any required value is missing or empty, skip the row
        required_fields = [k2_id, k2_name, k2_period, k2_duration, k2_depth, k2_prad, k2_teq]
        if any(f is None or f == "" for f in required_fields):
            continue

    

        with open('data/dataset.csv', 'a') as f:
            writer = csv.writer(f)
            writer.writerow(["k2", k2_id, k2_name, k2_score, k2_period, k2_duration, k2_depth, k2_prad, k2_teq])


with open('data/k2_data.csv', 'r') as f:
    reader = csv.reader(f)
    idx_id = None
    idx_name = None
    idx_disposition = None
    idx_period  = None
    idx_duration = None
    idx_depth = None
    idx_prad = None
    idx_teq = None
    for i, row in enumerate(reader):

        if i == 0:
            header = row
            idx_id = header.index("epic_hostname")
            idx_name = header.index("pl_name")
            idx_disposition = header.index("disposition")
            idx_period = header.index("pl_orbper")
            idx_duration = header.index("pl_trandur")
            idx_depth = header.index("pl_trandep")
            idx_prad = header.index("pl_rade")
            idx_teq = header.index("pl_eqt")
            continue

        try:
            k2_id = row[idx_id].split(" ")[1]
        except IndexError:
            continue

        k2_name = row[idx_name]
        k2_disposition = row[idx_disposition]
        k2_score = 0 if k2_disposition == "FALSE POSITIVE" else 1
        k2_period = trim_float_str(row[idx_period])
        k2_duration = trim_float_str(row[idx_duration])
        k2_depth = trim_float_str(row[idx_depth])
        k2_prad = trim_float_str(row[idx_prad])
        k2_teq = row[idx_teq]

        required_fields = [k2_id, k2_name, k2_period, k2_duration, k2_depth, k2_prad, k2_teq]
        if any(f is None or f == "" for f in required_fields):
            continue

        with open('data/dataset.csv', 'a') as f:
            writer = csv.writer(f)
            writer.writerow(["k2", k2_id, k2_name, k2_score, k2_period, k2_duration, k2_depth, k2_prad, k2_teq])