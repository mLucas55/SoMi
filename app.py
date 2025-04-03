import os
from flask import Flask, render_template, request, redirect, url_for, abort, send_from_directory
from werkzeug.utils import secure_filename
from remove_background import remove_background
from PIL import Image

app = Flask(__name__)

app.config['MAX_CONTENT_LENGTH'] = 1024 * 1024
app.config['UPLOAD_EXTENSIONS'] = ['.jpg', '.png', '.webp', '.avif']
app.config['UPLOAD_PATH'] = 'uploads'

def convert_to_jpg(input_path):
    try:
        img = Image.open(input_path)
        rgb_img = img.convert('RGB')
        new_path = os.path.splitext(input_path)[0] + ".jpg"
        rgb_img.save(new_path, format='JPEG')
        os.remove(input_path)  # Remove the original file
        return new_path
    except Exception as e:
        print(f"Error converting image: {e}")
        return input_path  # Return original path if conversion fails

@app.route('/')
def index():
    files = os.listdir(app.config['UPLOAD_PATH'])
    return render_template('index.html', files=files)

@app.route('/', methods=['POST'])
def upload_files():
    uploaded_file = request.files['file']
    filename = secure_filename(uploaded_file.filename)
    if filename != '':
        file_ext = os.path.splitext(filename)[1].lower()
        if file_ext not in app.config['UPLOAD_EXTENSIONS']:
            abort(400)
        
        file_path = os.path.join(app.config['UPLOAD_PATH'], filename)
        uploaded_file.save(file_path)
        
        # Convert AVIF and WEBP to JPG before processing
        if file_ext in ['.webp', '.avif']:
            file_path = convert_to_jpg(file_path)
        
        # Process the image
        output_path = os.path.join(app.config['UPLOAD_PATH'], "processed-" + os.path.basename(file_path))
        remove_background(file_path, output_path)
        
        # Remove the preprocessed image
        if os.path.exists(output_path):
            os.remove(file_path)
            print(f"Deleted: {file_path}")
        else:
            print("File not found!")

    return redirect(url_for('index'))

@app.route('/uploads/<filename>')
def uploaded_file(filename):
    return send_from_directory(app.config['UPLOAD_PATH'], filename)
