import os
from flask import Flask, render_template, request, redirect, url_for, abort, send_from_directory
from werkzeug.utils import secure_filename

app = Flask(__name__)

app.config['MAX_CONTENT_LENGTH'] = 8000000 # 8 MB file limit
app.config['UPLOAD_EXTENSIONS'] = ['.jpg', '.png', '.webp', '.avif']
app.config['UPLOAD_PATH'] = 'uploads'

@app.route('/')
def index():
    files = os.listdir(app.config['UPLOAD_PATH'])
    return render_template('index.html', files=files)

@app.route('/upload', methods=['POST'])
def upload_files():
    uploaded_file = request.files['file']
    filename = secure_filename(uploaded_file.filename)
    if filename != '':
        file_ext = os.path.splitext(filename)[1]
        if file_ext not in app.config['UPLOAD_EXTENSIONS']:
            abort(400)
        uploaded_file.save(os.path.join(app.config['UPLOAD_PATH'], filename))
    return redirect(url_for('index'))

# New route to serve uploaded images
@app.route('/uploads/<filename>')
def uploaded_file(filename):
    return send_from_directory(app.config['UPLOAD_PATH'], filename)

@app.route("/saved")
def saved():
    return render_template('saved.html')

@app.route("/about")
def about():
    return render_template('about.html')

@app.route('/delete-image', methods=['POST'])
def delete_image():
    data = request.get_json()
    filename = data.get('src')  # Get the filename from the front-end request

    if not filename:
        return {'success': False, 'error': 'No image source provided'}, 400

    # Build the full path to the image
    image_path = os.path.join(app.config['UPLOAD_PATH'], filename)

    try:
        if os.path.exists(image_path):
            os.remove(image_path)  # Delete the image file
            return {'success': True}, 200
        else:
            return {'success': False, 'error': 'Image not found'}, 404
    except Exception as e:
        return {'success': False, 'error': str(e)}, 500


"""
# save outfits
@app.route('/save-outfit', methods=['POST'])
#@login_required
def save_outfit():
    data = request.get_json()

    user = data.get('user')
    outfit_number = data.get('outfitNumber')
    images = data.get('images')

    if not outfit_number or not images:
        return {'success': False, 'error': 'Missing outfit number or image data'}, 400

    user_id = current_user.id
    outfit_dir = os.path.join(app.config['UPLOAD_PATH'], str(user_id), 'outfits', str(outfit_number))

    os.makedirs(outfit_dir, exist_ok=True)

    # Save outfit metadata as a text/JSON file
    metadata_path = os.path.join(outfit_dir, 'outfit.json')
    with open(metadata_path, 'w') as f:
        import json
        json.dump(images, f)

    # Optionally, copy image files into this outfit folder
    for img in images:
        img_name = img['imageName']
        src_path = os.path.join(app.config['UPLOAD_PATH'], str(user_id), img_name)
        dst_path = os.path.join(outfit_dir, img_name)

        if os.path.exists(src_path):
            import shutil
            shutil.copy(src_path, dst_path)

    return {'success': True}

#load outfits
@app.route('/load-outfit', methods=['POST'])
#@login_required

def load_outfit():
    data = request.get_json()

    user = data.get('user')
    outfit_number = data.get('outfitNumber')

    if not outfit_number:
        return {'success': False, 'error': 'Missing outfit number'}, 400

    user_id = current_user.id
    outfit_dir = os.path.join(app.config['UPLOAD_PATH'], str(user_id), 'outfits', str(outfit_number))
    metadata_path = os.path.join(outfit_dir, 'outfit.json')

    if not os.path.exists(metadata_path):
        return {'success': False, 'error': 'Outfit not found'}, 404

    import json
    with open(metadata_path, 'r') as f:
        images = json.load(f)

    # Prepend image URLs so JS can display them
    for img in images:
        img['src'] = url_for('uploaded_file', user_id=user_id, filename=f"outfits/{outfit_number}/{img['imageName']}")

    return {'success': True, 'images': images}

"""
