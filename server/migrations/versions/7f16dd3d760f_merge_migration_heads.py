"""merge migration heads

Revision ID: 7f16dd3d760f
Revises: 81c5da509200, e0995fdfd2e5
Create Date: 2025-10-07 08:44:46.272019

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '7f16dd3d760f'
down_revision: Union[str, None] = ('81c5da509200', 'e0995fdfd2e5')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
