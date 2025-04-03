import os
from flask import Flask, Flask, render_template, request, redirect, url_for, abort, send_from_directory
from werkzeug.utils import secure_filename
from remove_background import remove_background

from PIL import Image
import pillow_avif



app = Flask(__name__)

app.config['MAX_CONTENT_LENGTH'] = 1024 * 1024
app.config['UPLOAD_EXTENSIONS'] = ['.jpg', '.png', '.webp', '.avif']
app.config['UPLOAD_PATH'] = 'uploads'

@app.route('/')
def index():
    files = os.listdir(app.config['UPLOAD_PATH'])
    return render_template('index.html', files=files)

@app.route('/', methods=['POST'])
def upload_files():
    uploaded_file = request.files['file']
    filename = secure_filename(uploaded_file.filename)
    if filename != '':
        file_ext = os.path.splitext(filename)[1]
        if file_ext not in app.config['UPLOAD_EXTENSIONS']:
            abort(400)
        uploaded_file.save(os.path.join(app.config['UPLOAD_PATH'], filename))

        
        # ------------- Convert AVIF and WEBP to JPG before processing -------------
        #if file_ext == ".avif" or file_ext == ".webp":
            #conversion_path = os.path.join(app.config['UPLOAD_PATH'], filename)
            #convert_to_jpg(conversion_path)


        # ------------- Call the remove_background function -------------
        input_path = os.path.join(app.config['UPLOAD_PATH'], filename)
        output_path = os.path.join(app.config['UPLOAD_PATH'], "processed-" + filename)

        remove_background(input_path, output_path)
        

        # ------------- Remmove pre-processed image -------------
        if os.path.exists(output_path):
            os.remove(input_path)
            print(f"Deleted: {input_path}")
        else:
            print("File not found!")


    return redirect(url_for('index'))

@app.route('/uploads/<filename>')
def uploaded_file(filename):
    return send_from_directory(app.config['UPLOAD_PATH'], filename)