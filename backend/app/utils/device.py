import hashlib


def generate_device_hash(user_agent: str, ip: str) -> str:
    base = f"{user_agent}-{ip}"
    return hashlib.sha256(base.encode()).hexdigest()

