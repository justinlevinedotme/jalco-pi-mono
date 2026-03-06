#!/usr/bin/env bash
# Master Security Scanner - Runs all applicable security scans
# Usage: ./scan-all.sh [directory]

set -euo pipefail

DIR="${1:-.}"
SKILL_DIR="$(dirname "$0")/.."
TOTAL_ISSUES=0

echo "╔════════════════════════════════════════════════════════════╗"
echo "║           SECURITY SCAN - VIBECODING VULNERABILITY         ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""
echo "Directory: $DIR"
echo "Timestamp: $(date -Iseconds)"
echo ""

run_scan() {
    local name="$1"
    local script="$2"
    local condition="$3"
    
    if eval "$condition"; then
        echo ""
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        echo "Running: $name"
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        
        if "$script" "$DIR"; then
            echo "[✓] $name: No issues found"
        else
            echo "[!] $name: Issues detected"
            TOTAL_ISSUES=$((TOTAL_ISSUES + 1))
        fi
    fi
}

# Always run secrets scan
run_scan "Secrets Scan" \
    ~/.pi/agent/skills/security-secrets/scripts/scan.sh \
    "true"

# Always run AI keys scan
run_scan "AI Keys Scan" \
    ~/.pi/agent/skills/security-ai-keys/scripts/scan.sh \
    "true"

echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo "║                      FINAL SUMMARY                         ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

if [[ $TOTAL_ISSUES -gt 0 ]]; then
    echo "[!] $TOTAL_ISSUES scan(s) found potential security issues."
    echo ""
    echo "Next steps:"
    echo "  1. Review each finding above"
    echo "  2. Prioritize CRITICAL and HIGH severity items"
    exit 1
else
    echo "[✓] All scans passed. No obvious issues detected."
    echo ""
    echo "Note: Automated scans catch common patterns only."
    echo "Manual review is still recommended for production code."
    exit 0
fi
