"""merge migration heads for phase16

Revision ID: 016d5fc83fb7
Revises: 20251009_magic_links, f1e2d3c4b5a6
Create Date: 2025-10-09 21:28:16.713361

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '016d5fc83fb7'
down_revision: Union[str, None] = ('20251009_magic_links', 'f1e2d3c4b5a6')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
