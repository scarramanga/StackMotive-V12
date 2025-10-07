"""
Snapshot Exporter - Generate portfolio snapshots in multiple formats
"""
import os
import json
import csv
import io
import hashlib
from datetime import datetime
from typing import Dict, Any, Tuple
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.units import inch


def generate_json_snapshot(data: Dict[str, Any]) -> Tuple[str, str]:
    """
    Generate JSON snapshot
    
    Returns: (content, checksum)
    """
    content = json.dumps(data, indent=2)
    checksum = hashlib.sha256(content.encode()).hexdigest()
    return content, checksum


def generate_csv_snapshot(positions: list) -> Tuple[str, str]:
    """
    Generate CSV snapshot of positions
    
    Returns: (content, checksum)
    """
    output = io.StringIO()
    if not positions:
        positions = []
    
    fieldnames = ['symbol', 'quantity', 'avg_price', 'current_price', 'market_value', 'unrealized_pnl', 'weight_pct']
    writer = csv.DictWriter(output, fieldnames=fieldnames)
    writer.writeheader()
    
    for pos in positions:
        writer.writerow({
            'symbol': pos.get('symbol', ''),
            'quantity': pos.get('quantity', 0),
            'avg_price': pos.get('avg_price', 0),
            'current_price': pos.get('current_price', 0),
            'market_value': pos.get('market_value', 0),
            'unrealized_pnl': pos.get('unrealized_pnl', 0),
            'weight_pct': pos.get('weight_pct', 0)
        })
    
    content = output.getvalue()
    checksum = hashlib.sha256(content.encode()).hexdigest()
    return content, checksum


def generate_pdf_snapshot(data: Dict[str, Any], output_path: str) -> str:
    """
    Generate PDF snapshot report
    
    Returns: checksum of the PDF file
    """
    doc = SimpleDocTemplate(output_path, pagesize=letter)
    styles = getSampleStyleSheet()
    story = []
    
    title = Paragraph(f"<b>Portfolio Snapshot Report</b>", styles['Title'])
    story.append(title)
    story.append(Spacer(1, 0.2*inch))
    
    timestamp = Paragraph(f"Generated: {datetime.utcnow().strftime('%Y-%m-%d %H:%M UTC')}", styles['Normal'])
    story.append(timestamp)
    story.append(Spacer(1, 0.3*inch))
    
    summary_data = data.get('summary', {})
    summary_text = f"""
    <b>Portfolio Summary</b><br/>
    Total Positions: {summary_data.get('total_positions', 0)}<br/>
    Total Value: ${summary_data.get('total_value', 0):,.2f}<br/>
    Unrealized P&L: ${summary_data.get('unrealized_pnl', 0):,.2f}<br/>
    """
    story.append(Paragraph(summary_text, styles['Normal']))
    story.append(Spacer(1, 0.3*inch))
    
    positions = data.get('positions', [])[:10]
    if positions:
        story.append(Paragraph("<b>Top Positions</b>", styles['Heading2']))
        story.append(Spacer(1, 0.1*inch))
        
        table_data = [['Symbol', 'Quantity', 'Value', 'Weight %']]
        for pos in positions:
            table_data.append([
                pos.get('symbol', ''),
                str(pos.get('quantity', 0)),
                f"${pos.get('market_value', 0):,.2f}",
                f"{pos.get('weight_pct', 0):.1f}%"
            ])
        
        table = Table(table_data)
        table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 12),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
            ('GRID', (0, 0), (-1, -1), 1, colors.black)
        ]))
        story.append(table)
    
    overlays = data.get('overlays', {})
    if overlays:
        story.append(Spacer(1, 0.3*inch))
        story.append(Paragraph("<b>Risk Metrics</b>", styles['Heading2']))
        story.append(Spacer(1, 0.1*inch))
        
        concentration = overlays.get('concentration', {})
        drawdown = overlays.get('drawdown', {})
        
        risk_text = f"""
        Concentration: {concentration.get('concentration', 'N/A')}<br/>
        HHI Index: {concentration.get('hhi', 0)}<br/>
        Max Drawdown: {drawdown.get('max_drawdown_pct', 0):.1f}%<br/>
        Current Drawdown: {drawdown.get('current_drawdown_pct', 0):.1f}%<br/>
        """
        story.append(Paragraph(risk_text, styles['Normal']))
    
    doc.build(story)
    
    with open(output_path, 'rb') as f:
        checksum = hashlib.sha256(f.read()).hexdigest()
    
    return checksum


def create_snapshot(user_id: int, db_data: Dict[str, Any], export_dir: str) -> Dict[str, Any]:
    """
    Create portfolio snapshot in multiple formats
    
    Args:
        user_id: User ID
        db_data: Portfolio data from database
        export_dir: Directory to save exports
    
    Returns:
        Dict with artifact paths and checksums
    """
    os.makedirs(export_dir, exist_ok=True)
    
    timestamp = datetime.utcnow().strftime('%Y%m%d_%H%M%S')
    base_filename = f"portfolio_{user_id}_{timestamp}"
    
    json_content, json_checksum = generate_json_snapshot(db_data)
    json_path = os.path.join(export_dir, f"{base_filename}.json")
    with open(json_path, 'w') as f:
        f.write(json_content)
    
    positions = db_data.get('positions', [])
    csv_content, csv_checksum = generate_csv_snapshot(positions)
    csv_path = os.path.join(export_dir, f"{base_filename}.csv")
    with open(csv_path, 'w') as f:
        f.write(csv_content)
    
    pdf_path = os.path.join(export_dir, f"{base_filename}.pdf")
    pdf_checksum = generate_pdf_snapshot(db_data, pdf_path)
    
    return {
        "json": {"path": json_path, "checksum": json_checksum},
        "csv": {"path": csv_path, "checksum": csv_checksum},
        "pdf": {"path": pdf_path, "checksum": pdf_checksum}
    }
