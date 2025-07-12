#!/usr/bin/env python3
"""
Flask app for the SkillSwap Platform with PostgreSQL database
"""

from flask import Flask, send_from_directory, jsonify, request
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy.orm import DeclarativeBase
import os
import json
from datetime import datetime

class Base(DeclarativeBase):
    pass

db = SQLAlchemy(model_class=Base)

# Create the app
app = Flask(__name__, static_folder='.', template_folder='.')
app.secret_key = os.environ.get("SESSION_SECRET", "skillswap-secret-key")

# Configure the database
app.config["SQLALCHEMY_DATABASE_URI"] = os.environ.get("DATABASE_URL")
app.config["SQLALCHEMY_ENGINE_OPTIONS"] = {
    "pool_recycle": 300,
    "pool_pre_ping": True,
}

# Initialize the app with the extension
db.init_app(app)

# Create tables
with app.app_context():
    import models
    db.create_all()

@app.route('/')
def index():
    return send_from_directory('.', 'index.html')

@app.route('/<path:filename>')
def serve_static(filename):
    return send_from_directory('.', filename)

# API Routes
@app.route('/api/users', methods=['GET'])
def get_users():
    from models import User
    users = User.query.filter_by(banned=False).all()
    return jsonify([user.to_dict() for user in users])

@app.route('/api/users', methods=['POST'])
def create_user():
    from models import User, Skill, WantedSkill
    data = request.json
    
    # Check if user already exists
    existing_user = User.query.filter_by(name=data['name']).first()
    if existing_user:
        return update_user_by_name(data['name'])
    
    user = User(
        name=data['name'],
        location=data.get('location', ''),
        photo=data.get('photo', ''),
        availability=data.get('availability', 'Flexible'),
        is_public=data.get('isPublic', True)
    )
    
    db.session.add(user)
    db.session.flush()  # Get the user ID
    
    # Add skills offered
    for skill_name in data.get('skillsOffered', []):
        if skill_name.strip():
            skill = Skill(name=skill_name.strip(), user_id=user.id)
            db.session.add(skill)
    
    # Add skills wanted
    for skill_name in data.get('skillsWanted', []):
        if skill_name.strip():
            wanted_skill = WantedSkill(name=skill_name.strip(), user_id=user.id)
            db.session.add(wanted_skill)
    
    db.session.commit()
    return jsonify(user.to_dict()), 201

def update_user_by_name(name):
    from models import User, Skill, WantedSkill
    user = User.query.filter_by(name=name).first()
    if not user:
        return jsonify({'error': 'User not found'}), 404
        
    data = request.json
    
    user.location = data.get('location', '')
    user.photo = data.get('photo', '')
    user.availability = data.get('availability', 'Flexible')
    user.is_public = data.get('isPublic', True)
    
    # Update skills
    Skill.query.filter_by(user_id=user.id).delete()
    WantedSkill.query.filter_by(user_id=user.id).delete()
    
    for skill_name in data.get('skillsOffered', []):
        if skill_name.strip():
            skill = Skill(name=skill_name.strip(), user_id=user.id)
            db.session.add(skill)
    
    for skill_name in data.get('skillsWanted', []):
        if skill_name.strip():
            wanted_skill = WantedSkill(name=skill_name.strip(), user_id=user.id)
            db.session.add(wanted_skill)
    
    db.session.commit()
    return jsonify(user.to_dict())

@app.route('/api/users/<string:name>', methods=['GET'])
def get_user_by_name(name):
    from models import User
    user = User.query.filter_by(name=name).first()
    if user:
        return jsonify(user.to_dict())
    return jsonify(None)

@app.route('/api/swaps', methods=['GET'])
def get_swaps():
    from models import SwapRequest, User
    user_name = request.args.get('user')
    if not user_name:
        return jsonify([])
    
    user = User.query.filter_by(name=user_name).first()
    if not user:
        return jsonify([])
    
    swaps = SwapRequest.query.filter(
        (SwapRequest.sender_id == user.id) | (SwapRequest.receiver_id == user.id)
    ).all()
    
    return jsonify([swap.to_dict() for swap in swaps])

@app.route('/api/swaps', methods=['POST'])
def create_swap():
    from models import User, SwapRequest
    data = request.json
    
    sender = User.query.filter_by(name=data['from']).first()
    receiver = User.query.filter_by(name=data['to']).first()
    
    if not sender or not receiver:
        return jsonify({'error': 'User not found'}), 404
    
    # Check if swap already exists
    existing_swap = SwapRequest.query.filter_by(
        sender_id=sender.id, 
        receiver_id=receiver.id, 
        status='Pending'
    ).first()
    
    if existing_swap:
        return jsonify({'error': 'Swap request already exists'}), 400
    
    swap = SwapRequest(
        sender_id=sender.id,
        receiver_id=receiver.id,
        note=data.get('note', ''),
        status='Pending'
    )
    
    db.session.add(swap)
    db.session.commit()
    return jsonify(swap.to_dict()), 201

@app.route('/api/swaps/<int:swap_id>', methods=['PUT'])
def update_swap(swap_id):
    from models import SwapRequest
    swap = SwapRequest.query.get_or_404(swap_id)
    data = request.json
    
    swap.status = data['status']
    db.session.commit()
    return jsonify(swap.to_dict())

@app.route('/api/swaps/<string:from_user>/<string:to_user>', methods=['PUT'])
def update_swap_by_users(from_user, to_user):
    from models import SwapRequest, User
    
    sender = User.query.filter_by(name=from_user).first()
    receiver = User.query.filter_by(name=to_user).first()
    
    if not sender or not receiver:
        return jsonify({'error': 'User not found'}), 404
    
    swap = SwapRequest.query.filter_by(
        sender_id=sender.id, 
        receiver_id=receiver.id
    ).first()
    
    if not swap:
        return jsonify({'error': 'Swap not found'}), 404
    
    data = request.json
    swap.status = data['status']
    db.session.commit()
    return jsonify(swap.to_dict())

@app.route('/api/swaps/<string:from_user>/<string:to_user>', methods=['DELETE'])
def delete_swap_by_users(from_user, to_user):
    from models import SwapRequest, User
    
    sender = User.query.filter_by(name=from_user).first()
    receiver = User.query.filter_by(name=to_user).first()
    
    if not sender or not receiver:
        return jsonify({'error': 'User not found'}), 404
    
    swap = SwapRequest.query.filter_by(
        sender_id=sender.id, 
        receiver_id=receiver.id,
        status='Pending'
    ).first()
    
    if not swap:
        return jsonify({'error': 'Pending swap not found'}), 404
    
    db.session.delete(swap)
    db.session.commit()
    return jsonify({'message': 'Swap deleted successfully'})

@app.route('/api/announcements', methods=['GET'])
def get_announcements():
    from models import Announcement
    announcement = Announcement.query.filter_by(is_active=True).order_by(Announcement.created_at.desc()).first()
    if announcement:
        return jsonify({'message': announcement.message})
    return jsonify({'message': 'No announcements yet'})

@app.route('/api/announcements', methods=['POST'])
def create_announcement():
    from models import Announcement
    data = request.json
    
    # Deactivate previous announcements
    Announcement.query.update({'is_active': False})
    
    announcement = Announcement(message=data['message'])
    db.session.add(announcement)
    db.session.commit()
    return jsonify({'message': announcement.message}), 201

@app.route('/api/admin/users/<int:user_id>/ban', methods=['POST'])
def ban_user(user_id):
    from models import User
    user = User.query.get_or_404(user_id)
    user.banned = True
    db.session.commit()
    return jsonify({'message': f'User {user.name} has been banned'})

@app.route('/api/admin/users/<string:user_name>/ban', methods=['POST'])
def ban_user_by_name(user_name):
    from models import User
    user = User.query.filter_by(name=user_name).first()
    if not user:
        return jsonify({'error': 'User not found'}), 404
    user.banned = True
    db.session.commit()
    return jsonify({'message': f'User {user.name} has been banned'})

@app.route('/api/admin/users/<string:user_name>/moderate-skills', methods=['POST'])
def moderate_skills_by_name(user_name):
    from models import User, Skill
    user = User.query.filter_by(name=user_name).first()
    if not user:
        return jsonify({'error': 'User not found'}), 404
    Skill.query.filter_by(user_id=user.id).update({'rejected': True})
    db.session.commit()
    return jsonify({'message': f'Skills for {user.name} have been rejected'})

@app.route('/api/admin/data', methods=['GET'])
def get_admin_data():
    from models import User, SwapRequest
    users = User.query.all()
    swaps = SwapRequest.query.all()
    
    return jsonify({
        'users': [user.to_dict() for user in users],
        'totalSwaps': len(swaps),
        'activeUsers': len([u for u in users if not u.banned])
    })

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)