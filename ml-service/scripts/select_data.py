import csv
import os
# not beautiful code but it works

DATASET_PATH = "data/dataset.csv"
HEADERS = ["type", "id", "name", "disposition", "period", "duration", "depth", "prad", "teq"]
class SelectData:
    def __init__(self):
        with open(DATASET_PATH, 'r') as f:
            reader = csv.reader(f)
            next(reader)  # skip header
            self.data = [row for row in reader]

        if not os.path.exists(DATASET_PATH):
            self.create_dataset()
            
    def parse_data_to_json(self):
        data_json = []
        for row in self.data:
            data_json.append({
                "type": row[0],
                "id": row[1],
                "name": row[2],
                "disposition": row[3],
                "period": row[4],
                "duration": row[5],
                "depth": row[6],
                "prad": row[7],
                "teq": row[8]
            })
        return data_json

    def parse_json_to_data(self, data_json):
        self.data = []
        for row in data_json:
            self.data.append([row["type"], row["id"], row["name"], row["disposition"], row["period"], row["duration"], row["depth"], row["prad"], row["teq"]])

    def save_data(self, user_csv_path):
        with open(user_csv_path, 'w') as f:
            writer = csv.writer(f)
            writer.writerow(HEADERS)
            for row in self.data:
                writer.writerow(row)
    
    def create_dataset(self):
        for display_type in ["koi", "toi", "k2","user"]:
            with open(f'data/{display_type}_data.csv', 'r') as f:
                reader = csv.reader(f)
                for i, row in enumerate(reader):
                    if i == 0:
                        continue
                    self.data.append([display_type, *row])

    def upload_user_data(self, file):
        row_data = []
        reader = csv.reader(file)

        for i, row in enumerate(reader):
            if i == 0:
                # Get all indices of headers and pile them up in an array
                header_indices = [i for i, h in enumerate(row) if h in HEADERS]
                continue
            print(header_indices)
            print("row",row)

            self.data.insert(0, ["user", *row])

        # print("row_data", row_data)
            
        # with open(user_csv_path, 'w') as f:
        #     writer = csv.writer(f)
        #     writer.writerow(HEADERS[1:])
        #     for row in row_data:
        #         writer.writerow(row)
        
    def update_display_type(self, display_types):
        self.data = [row for row in self.data if row[0] == "user"]
        
        # For each display_type, add all rows from the corresponding CSV
        for display_type in display_types:
            try:
                with open(f"data/{display_type}_data.csv", "r") as f:
                    reader = csv.reader(f)
                    for i, row in enumerate(reader):
                        if i == 0:
                            continue  # skip header
                        # Prepend the display_type as the first column
                        self.data.append([display_type] + row)
            except FileNotFoundError:
                print(f"Warning: data/{display_type}_data.csv not found.")



