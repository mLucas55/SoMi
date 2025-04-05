import os

def remove_image(input_path, output_path):
    if os.path.exists(output_path):
        os.remove(input_path)
        print(f"Deleted: {input_path}")
    else:
        print("File not found!")