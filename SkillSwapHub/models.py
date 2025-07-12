"""
Database models for the SkillSwap Platform
"""

from main import db
from datetime import datetime
from sqlalchemy import Text, DateTime, Boolean, Integer, String, ForeignKey
from sqlalchemy.orm import relationship

class User(db.Model):
    __tablename__ = 'users'
    
    id = db.Column(Integer, primary_key=True)
    name = db.Column(String(100), nullable=False)
    location = db.Column(String(100))
    photo = db.Column(Text)
    availability = db.Column(String(50), default='Flexible')
    is_public = db.Column(Boolean, default=True)
    banned = db.Column(Boolean, default=False)
    created_at = db.Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    skills_offered = relationship("Skill", back_populates="user", foreign_keys="Skill.user_id")
    skills_wanted = relationship("WantedSkill", back_populates="user")
    sent_swaps = relationship("SwapRequest", back_populates="sender", foreign_keys="SwapRequest.sender_id")
    received_swaps = relationship("SwapRequest", back_populates="receiver", foreign_keys="SwapRequest.receiver_id")
    feedback_given = relationship("Feedback", back_populates="giver", foreign_keys="Feedback.giver_id")
    feedback_received = relationship("Feedback", back_populates="receiver", foreign_keys="Feedback.receiver_id")
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'location': self.location,
            'photo': self.photo,
            'availability': self.availability,
            'isPublic': self.is_public,
            'banned': self.banned,
            'skillsOffered': [skill.name for skill in self.skills_offered if not skill.rejected],
            'skillsWanted': [skill.name for skill in self.skills_wanted],
            'createdAt': self.created_at.isoformat(),
            'swaps': [swap.to_dict() for swap in self.sent_swaps + self.received_swaps]
        }

class Skill(db.Model):
    __tablename__ = 'skills'
    
    id = db.Column(Integer, primary_key=True)
    name = db.Column(String(100), nullable=False)
    user_id = db.Column(Integer, ForeignKey('users.id'), nullable=False)
    rejected = db.Column(Boolean, default=False)
    created_at = db.Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    user = relationship("User", back_populates="skills_offered")

class WantedSkill(db.Model):
    __tablename__ = 'wanted_skills'
    
    id = db.Column(Integer, primary_key=True)
    name = db.Column(String(100), nullable=False)
    user_id = db.Column(Integer, ForeignKey('users.id'), nullable=False)
    created_at = db.Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    user = relationship("User", back_populates="skills_wanted")

class SwapRequest(db.Model):
    __tablename__ = 'swap_requests'
    
    id = db.Column(Integer, primary_key=True)
    sender_id = db.Column(Integer, ForeignKey('users.id'), nullable=False)
    receiver_id = db.Column(Integer, ForeignKey('users.id'), nullable=False)
    note = db.Column(Text)
    status = db.Column(String(20), default='Pending')  # Pending, Accepted, Rejected, Cancelled
    created_at = db.Column(DateTime, default=datetime.utcnow)
    updated_at = db.Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    sender = relationship("User", back_populates="sent_swaps", foreign_keys=[sender_id])
    receiver = relationship("User", back_populates="received_swaps", foreign_keys=[receiver_id])
    feedback = relationship("Feedback", back_populates="swap_request")
    
    def to_dict(self):
        return {
            'id': self.id,
            'from': self.sender.name,
            'to': self.receiver.name,
            'fromSkills': [skill.name for skill in self.sender.skills_offered if not skill.rejected],
            'toSkills': [skill.name for skill in self.receiver.skills_offered if not skill.rejected],
            'note': self.note or '',
            'status': self.status,
            'timestamp': self.created_at.isoformat(),
            'createdAt': self.created_at.strftime('%Y-%m-%d %H:%M:%S')
        }

class Feedback(db.Model):
    __tablename__ = 'feedback'
    
    id = db.Column(Integer, primary_key=True)
    swap_request_id = db.Column(Integer, ForeignKey('swap_requests.id'), nullable=False)
    giver_id = db.Column(Integer, ForeignKey('users.id'), nullable=False)
    receiver_id = db.Column(Integer, ForeignKey('users.id'), nullable=False)
    rating = db.Column(Integer)  # 1-5 star rating
    comment = db.Column(Text)
    created_at = db.Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    swap_request = relationship("SwapRequest", back_populates="feedback")
    giver = relationship("User", back_populates="feedback_given", foreign_keys=[giver_id])
    receiver = relationship("User", back_populates="feedback_received", foreign_keys=[receiver_id])

class Announcement(db.Model):
    __tablename__ = 'announcements'
    
    id = db.Column(Integer, primary_key=True)
    message = db.Column(Text, nullable=False)
    created_at = db.Column(DateTime, default=datetime.utcnow)
    is_active = db.Column(Boolean, default=True)
    
    def to_dict(self):
        return {
            'id': self.id,
            'message': self.message,
            'createdAt': self.created_at.isoformat(),
            'isActive': self.is_active
        }