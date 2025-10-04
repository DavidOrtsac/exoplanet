import csv
import os
# not beautiful code but it works

DATASET_PATH = "data/dataset.csv"
HEADERS = ["type", "id", "name", "disposition", "period", "duration", "depth", "prad", "teq"]
class SelectData:
    def __init__(self):
        self.data = []
        self.display_type = ["koi", "toi", "k2","user"]
        if not os.path.exists(DATASET_PATH):
            self.create_dataset()


    def save_data(self):
        with open('data/dataset.csv', 'w') as f:
            writer = csv.writer(f)
            writer.writerow(HEADERS)
            for row in self.data:
                writer.writerow(row)
    
    def create_dataset(self):
        for display_type in self.display_type:
            with open(f'data/{display_type}_data.csv', 'r') as f:
                reader = csv.reader(f)
                for i, row in enumerate(reader):
                    if i == 0:
                        continue
                    self.data.append([display_type, *row])
        self.save_data()

    def upload_user_data(self, file):
        row_data = []
        reader = csv.reader(file)

        for i, row in enumerate(reader):
            if i == 0:
                # Get all indices of headers and pile them up in an array
                header_indices = [i for i, h in enumerate(row) if h in HEADERS]
                continue
            print(header_indices)
            print(row)
            row_data.append([row[i] for i in header_indices])
            
        with open('data/user_data.csv', 'w') as f:
            writer = csv.writer(f)
            writer.writerow(HEADERS[1:])
            for row in row_data:
                writer.writerow(row)
        
    def update_display_type(self, display_type):
        self.display_type = display_type
        self.create_dataset()



