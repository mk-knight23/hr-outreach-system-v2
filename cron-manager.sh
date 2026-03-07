#!/bin/bash

# HR Outreach System v2 - Cron Manager
# Usage: ./cron-manager.sh [start|stop|status|logs]

HR_DIR="/Users/mkazi/.openclaw/workspace/hr-outreach-system-v2"
LOG_FILE="$HR_DIR/logs/cron.log"

show_help() {
    echo "HR Outreach System v2 - Cron Manager"
    echo ""
    echo "Usage: ./cron-manager.sh [command]"
    echo ""
    echo "Commands:"
    echo "  start    - Start the cron job (adds to crontab)"
    echo "  stop     - Stop the cron job (removes from crontab)"
    echo "  status   - Check if cron job is active"
    echo "  logs     - View recent cron logs"
    echo "  run      - Run once manually (dry-run mode)"
    echo "  live     - Run once manually (live mode)"
    echo ""
}

start_cron() {
    if crontab -l 2>/dev/null | grep -q "HR Outreach System v2"; then
        echo "✅ Cron job already active"
    else
        (crontab -l 2>/dev/null; echo ""; echo "# HR Outreach System v2 - Runs every 2 hours"; echo "0 */2 * * * cd $HR_DIR \u0026\u0026 /opt/homebrew/bin/python3 scripts/run_outreach.py --action=full \u003e\u003e logs/cron.log 2\u003e\u00261") | crontab -
        echo "✅ Cron job started - runs every 2 hours"
    fi
}

stop_cron() {
    crontab -l 2>/dev/null | grep -v "HR Outreach System v2" | crontab -
    echo "🛑 Cron job stopped"
}

status_cron() {
    if crontab -l 2>/dev/null | grep -q "HR Outreach System v2"; then
        echo "✅ HR Outreach cron job is ACTIVE"
        echo ""
        echo "Schedule: Every 2 hours"
        echo "Command: python3 scripts/run_outreach.py --action=full"
        echo "Log file: logs/cron.log"
        echo ""
        echo "Next runs (approximate):"
        for i in 0 2 4 6 8 10 12 14 16 18 20 22; do
            echo "  • ${i}:00 IST"
        done
    else
        echo "🛑 HR Outreach cron job is NOT ACTIVE"
        echo "Run './cron-manager.sh start' to activate"
    fi
}

view_logs() {
    if [ -f "$LOG_FILE" ]; then
        echo "=== Recent Cron Logs ==="
        tail -50 "$LOG_FILE"
    else
        echo "No logs yet. Run the system first."
    fi
}

run_dry() {
    echo "🧪 Running DRY-RUN mode (no emails sent)..."
    cd "$HR_DIR" \u0026\u0026 python3 scripts/run_outreach.py --dry-run --action=full
}

run_live() {
    echo "🚀 Running LIVE mode (emails will be sent)!"
    read -p "Are you sure? (yes/no): " confirm
    if [ "$confirm" = "yes" ]; then
        cd "$HR_DIR" \u0026\u0026 python3 scripts/run_outreach.py --action=full
    else
        echo "Cancelled."
    fi
}

case "${1:-status}" in
    start)
        start_cron
        ;;
    stop)
        stop_cron
        ;;
    status)
        status_cron
        ;;
    logs)
        view_logs
        ;;
    run)
        run_dry
        ;;
    live)
        run_live
        ;;
    help|--help|-h)
        show_help
        ;;
    *)
        echo "Unknown command: $1"
        show_help
        exit 1
        ;;
esac
