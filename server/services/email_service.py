import logging

logger = logging.getLogger(__name__)

def send_magic_link_email(email: str, magic_link_url: str):
    """Mock email service - logs magic link URL"""
    logger.info(f"📧 Magic Link Email (MOCK)")
    logger.info(f"   To: {email}")
    logger.info(f"   Link: {magic_link_url}")
    logger.info(f"   (In production, this would send a real email)")
    
    return True
