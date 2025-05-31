#!/usr/bin/env python3
"""
Generate research reports from bibliography.toml
Usage: python research_report.py
"""

try:
    import tomllib  # Python 3.11+
except ImportError:
    try:
        import tomli as tomllib  # type: ignore # Fallback for older Python
    except ImportError:
        print("Error: Need to install toml support.")
        print("Run: pip install tomli")
        sys.exit(1)

from datetime import datetime
import sys
import os
from collections import defaultdict

def load_bibliography(file_path="data/bibliography.toml"):
    """Load the bibliography TOML file"""
    try:
        with open(file_path, 'rb') as f:  # Note: 'rb' mode for tomllib
            return tomllib.load(f)
    except FileNotFoundError:
        print(f"Error: Could not find {file_path}")
        sys.exit(1)
    except Exception as e:
        print(f"Error loading file: {e}")
        sys.exit(1)

def generate_priority_report(data):
    """Generate report organized by priority"""
    research_notes = {k: v for k, v in data.items() 
                     if v.get('type') == 'research_note'}
    
    if not research_notes:
        return "No research notes found.\n"
    
    report = f"# Research Notes Priority Report\n"
    report += f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M')}\n\n"
    
    # Group by priority
    by_priority = defaultdict(list)
    for note_id, note in research_notes.items():
        priority = note.get('priority', 'unknown')
        by_priority[priority].append((note_id, note))
    
    # Output by priority
    for priority in ['high', 'medium', 'low', 'unknown']:
        if priority in by_priority:
            report += f"## {priority.upper()} PRIORITY ({len(by_priority[priority])} items)\n\n"
            
            for note_id, note in by_priority[priority]:
                report += f"### {note_id}\n"
                report += f"**Topic:** {note.get('topic', 'N/A')}\n\n"
                report += f"**Films:** {', '.join(note.get('films', []))}\n\n"
                report += f"**Finding:** {note.get('finding', 'N/A')}\n\n"
                report += f"**Status:** {note.get('status', 'unknown')}\n\n"
                
                if note.get('potential_placement'):
                    report += f"**Potential Use:** {note['potential_placement']}\n\n"
                
                if note.get('follow_up'):
                    report += f"**Next Steps:** {note['follow_up']}\n\n"
                
                report += "---\n\n"
    
    return report

def generate_status_report(data):
    """Generate report organized by status"""
    research_notes = {k: v for k, v in data.items() 
                     if v.get('type') == 'research_note'}
    
    report = f"# Research Notes Status Report\n"
    report += f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M')}\n\n"
    
    # Group by status
    by_status = defaultdict(list)
    for note_id, note in research_notes.items():
        status = note.get('status', 'unknown')
        by_status[status].append((note_id, note))
    
    # Quick summary
    report += "## Status Summary\n"
    for status, notes in by_status.items():
        report += f"- **{status.title()}:** {len(notes)} items\n"
    report += "\n"
    
    # Detailed breakdown
    for status in ['captured', 'in_progress', 'applied', 'archived', 'unknown']:
        if status in by_status:
            report += f"## {status.upper().replace('_', ' ')} ({len(by_status[status])} items)\n\n"
            
            for note_id, note in by_status[status]:
                report += f"- **{note.get('topic', note_id)}** "
                if note.get('films'):
                    report += f"({', '.join(note['films'])})"
                if note.get('priority'):
                    report += f" - *{note['priority']} priority*"
                report += "\n"
            report += "\n"
    
    return report

def generate_topic_report(data):
    """Generate report organized by topic/theme"""
    research_notes = {k: v for k, v in data.items() 
                     if v.get('type') == 'research_note'}
    
    report = f"# Research Notes by Topic\n"
    report += f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M')}\n\n"
    
    # Group by topic keywords
    topics = defaultdict(list)
    for note_id, note in research_notes.items():
        topic = note.get('topic', 'Uncategorized')
        topics[topic].append((note_id, note))
    
    for topic in sorted(topics.keys()):
        report += f"## {topic}\n\n"
        for note_id, note in topics[topic]:
            report += f"### {note_id}\n"
            report += f"**Films:** {', '.join(note.get('films', []))}\n\n"
            report += f"**Priority:** {note.get('priority', 'unknown')} | "
            report += f"**Status:** {note.get('status', 'unknown')}\n\n"
            report += f"{note.get('finding', 'N/A')}\n\n"
            
            if note.get('follow_up'):
                report += f"**Next:** {note['follow_up']}\n\n"
            
            report += "---\n\n"
    
    return report

def generate_action_items_report(data):
    """Generate focused action items report"""
    research_notes = {k: v for k, v in data.items() 
                     if v.get('type') == 'research_note'}
    
    report = f"# Action Items Report\n"
    report += f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M')}\n\n"
    
    # High priority items that need action
    high_priority = [(k, v) for k, v in research_notes.items() 
                     if v.get('priority') == 'high' and v.get('status') in ['captured', 'in_progress']]
    
    if high_priority:
        report += f"## HIGH PRIORITY ACTION ITEMS ({len(high_priority)} items)\n\n"
        for note_id, note in high_priority:
            report += f"### {note.get('topic', note_id)}\n"
            if note.get('follow_up'):
                report += f"**DO:** {note['follow_up']}\n\n"
            else:
                report += "**DO:** Review and determine next steps\n\n"
            
            report += f"*Context:* {note.get('finding', 'N/A')[:100]}...\n\n"
            report += "---\n\n"
    
    # Items with specific follow-up tasks
    with_followup = [(k, v) for k, v in research_notes.items() 
                     if v.get('follow_up') and v.get('status') != 'applied']
    
    if with_followup:
        report += f"## ALL ITEMS WITH FOLLOW-UP TASKS ({len(with_followup)} items)\n\n"
        for note_id, note in with_followup:
            priority_flag = "🔥" if note.get('priority') == 'high' else ""
            report += f"- {priority_flag} **{note.get('topic', note_id)}:** {note['follow_up']}\n"
        report += "\n"
    
    return report

def main():
    """Main function"""
    data = load_bibliography()
    
    # Create reports directory if it doesn't exist
    reports_dir = "reports"
    if not os.path.exists(reports_dir):
        os.makedirs(reports_dir)
        print(f"Created {reports_dir}/ directory")
    
    # Generate timestamp for filenames
    timestamp = datetime.now().strftime('%Y%m%d_%H%M')
    
    print("Research Notes Report Generator")
    print("=" * 40)
    print("1. Priority Report")
    print("2. Status Report") 
    print("3. Topic Report")
    print("4. Action Items Report")
    print("5. All Reports")
    
    choice = input("\nSelect report type (1-5): ").strip()
    
    reports = {
        '1': (f'priority_report_{timestamp}.md', generate_priority_report),
        '2': (f'status_report_{timestamp}.md', generate_status_report),
        '3': (f'topic_report_{timestamp}.md', generate_topic_report),
        '4': (f'action_items_{timestamp}.md', generate_action_items_report),
    }
    
    if choice == '5':
        # Generate all reports
        for filename, generator in reports.values():
            content = generator(data)
            filepath = os.path.join(reports_dir, filename)
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(content)
            print(f"Generated: {filepath}")
    elif choice in reports:
        filename, generator = reports[choice]
        content = generator(data)
        filepath = os.path.join(reports_dir, filename)
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Generated: {filepath}")
    else:
        print("Invalid choice")

if __name__ == "__main__":
    main()