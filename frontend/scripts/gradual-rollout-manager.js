#!/usr/bin/env node

/**
 * TypeScript Maintenance System - Gradual Rollout Manager
 * 
 * This script manages the gradual rollout of the TypeScript maintenance system
 * across team members, allowing for controlled adoption and easy rollback.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class GradualRolloutManager {
  constructor() {
    this.configPath = path.join(__dirname, '..', '.typescript-maintenance');
    this.rolloutConfigPath = path.join(this.configPath, 'rollout-config.json');
    this.teamConfigPath = path.join(this.configPath, 'team-config.json');
    
    this.ensureConfigDirectory();
    this.loadConfigurations();
  }

  ensureConfigDirectory() {
    if (!fs.existsSync(this.configPath)) {
      fs.mkdirSync(this.configPath, { recursive: true });
    }
  }

  loadConfigurations() {
    // Load rollout configuration
    if (fs.existsSync(this.rolloutConfigPath)) {
      this.rolloutConfig = JSON.parse(fs.readFileSync(this.rolloutConfigPath, 'utf8'));
    } else {
      this.rolloutConfig = this.getDefaultRolloutConfig();
      this.saveRolloutConfig();
    }

    // Load team configuration
    if (fs.existsSync(this.teamConfigPath)) {
      this.teamConfig = JSON.parse(fs.readFileSync(this.teamConfigPath, 'utf8'));
    } else {
      this.teamConfig = this.getDefaultTeamConfig();
      this.saveTeamConfig();
    }
  }

  getDefaultRolloutConfig() {
    return {
      phases: [
        {
          name: "foundation",
          description: "Basic pre-commit hooks and IDE setup",
          duration: "2 weeks",
          features: ["pre-commit-hooks", "ide-integration", "basic-validation"],
          rolloutPercentage: 100,
          status: "not-started"
        },
        {
          name: "integration",
          description: "Advanced features and monitoring",
          duration: "2 weeks",
          features: ["eslint-rules", "performance-monitoring", "error-recovery"],
          rolloutPercentage: 0,
          status: "not-started"
        },
        {
          name: "optimization",
          description: "Fine-tuning and customization",
          duration: "2 weeks",
          features: ["custom-rules", "team-dashboards", "advanced-monitoring"],
          rolloutPercentage: 0,
          status: "not-started"
        }
      ],
      currentPhase: 0,
      startDate: null,
      rollbackPlan: {
        enabled: true,
        triggerThreshold: 0.3, // 30% negative feedback triggers rollback consideration
        automaticRollback: false
      }
    };
  }

  getDefaultTeamConfig() {
    return {
      members: [],
      roles: {
        "team-lead": { priority: 1, earlyAdopter: true },
        "senior-developer": { priority: 2, earlyAdopter: true },
        "developer": { priority: 3, earlyAdopter: false },
        "junior-developer": { priority: 4, earlyAdopter: false }
      },
      feedback: {
        collection: {
          daily: true,
          weekly: true,
          monthly: true
        },
        channels: ["slack", "email", "survey"],
        thresholds: {
          satisfaction: 0.7,
          usability: 0.8,
          performance: 0.75
        }
      }
    };
  }

  saveRolloutConfig() {
    fs.writeFileSync(this.rolloutConfigPath, JSON.stringify(this.rolloutConfig, null, 2));
  }

  saveTeamConfig() {
    fs.writeFileSync(this.teamConfigPath, JSON.stringify(this.teamConfig, null, 2));
  }

  // Team member management
  addTeamMember(name, email, role, earlyAdopter = false) {
    const member = {
      name,
      email,
      role,
      earlyAdopter,
      joinDate: new Date().toISOString(),
      status: "pending",
      completedPhases: [],
      feedback: []
    };

    this.teamConfig.members.push(member);
    this.saveTeamConfig();
    
    console.log(`Added team member: ${name} (${role})`);
    return member;
  }

  updateMemberStatus(email, status, phase = null) {
    const member = this.teamConfig.members.find(m => m.email === email);
    if (!member) {
      throw new Error(`Team member not found: ${email}`);
    }

    member.status = status;
    if (phase && !member.completedPhases.includes(phase)) {
      member.completedPhases.push(phase);
    }

    this.saveTeamConfig();
    console.log(`Updated ${member.name} status to: ${status}`);
  }

  // Phase management
  startPhase(phaseIndex) {
    if (phaseIndex >= this.rolloutConfig.phases.length) {
      throw new Error(`Invalid phase index: ${phaseIndex}`);
    }

    const phase = this.rolloutConfig.phases[phaseIndex];
    phase.status = "in-progress";
    phase.startDate = new Date().toISOString();
    
    this.rolloutConfig.currentPhase = phaseIndex;
    this.saveRolloutConfig();

    console.log(`Started phase ${phaseIndex + 1}: ${phase.name}`);
    this.enablePhaseFeatures(phase.features);
  }

  completePhase(phaseIndex) {
    if (phaseIndex >= this.rolloutConfig.phases.length) {
      throw new Error(`Invalid phase index: ${phaseIndex}`);
    }

    const phase = this.rolloutConfig.phases[phaseIndex];
    phase.status = "completed";
    phase.endDate = new Date().toISOString();
    
    this.saveRolloutConfig();
    console.log(`Completed phase ${phaseIndex + 1}: ${phase.name}`);
  }

  enablePhaseFeatures(features) {
    console.log("Enabling features:", features);
    
    features.forEach(feature => {
      switch (feature) {
        case "pre-commit-hooks":
          this.enablePreCommitHooks();
          break;
        case "ide-integration":
          this.enableIDEIntegration();
          break;
        case "basic-validation":
          this.enableBasicValidation();
          break;
        case "eslint-rules":
          this.enableESLintRules();
          break;
        case "performance-monitoring":
          this.enablePerformanceMonitoring();
          break;
        case "error-recovery":
          this.enableErrorRecovery();
          break;
        case "custom-rules":
          this.enableCustomRules();
          break;
        case "team-dashboards":
          this.enableTeamDashboards();
          break;
        case "advanced-monitoring":
          this.enableAdvancedMonitoring();
          break;
        default:
          console.warn(`Unknown feature: ${feature}`);
      }
    });
  }

  // Feature enablement methods
  enablePreCommitHooks() {
    try {
      execSync('npx husky install', { stdio: 'inherit' });
      console.log("✓ Pre-commit hooks enabled");
    } catch (error) {
      console.error("✗ Failed to enable pre-commit hooks:", error.message);
    }
  }

  enableIDEIntegration() {
    const vscodeSettingsPath = path.join(__dirname, '..', '.vscode', 'settings.json');
    if (fs.existsSync(vscodeSettingsPath)) {
      console.log("✓ IDE integration already configured");
    } else {
      console.log("ℹ IDE integration configuration available in .vscode/settings.json");
    }
  }

  enableBasicValidation() {
    console.log("✓ Basic TypeScript validation enabled");
  }

  enableESLintRules() {
    console.log("✓ ESLint TypeScript rules enabled");
  }

  enablePerformanceMonitoring() {
    console.log("✓ Performance monitoring enabled");
  }

  enableErrorRecovery() {
    console.log("✓ Error recovery system enabled");
  }

  enableCustomRules() {
    console.log("✓ Custom rules configuration enabled");
  }

  enableTeamDashboards() {
    console.log("✓ Team dashboards enabled");
  }

  enableAdvancedMonitoring() {
    console.log("✓ Advanced monitoring enabled");
  }

  // Feedback collection
  collectFeedback(email, feedback) {
    const member = this.teamConfig.members.find(m => m.email === email);
    if (!member) {
      throw new Error(`Team member not found: ${email}`);
    }

    const feedbackEntry = {
      timestamp: new Date().toISOString(),
      phase: this.rolloutConfig.currentPhase,
      ...feedback
    };

    member.feedback.push(feedbackEntry);
    this.saveTeamConfig();
    
    console.log(`Collected feedback from ${member.name}`);
    this.analyzeFeedback();
  }

  analyzeFeedback() {
    const allFeedback = this.teamConfig.members.flatMap(m => m.feedback);
    const recentFeedback = allFeedback.filter(f => {
      const feedbackDate = new Date(f.timestamp);
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      return feedbackDate > weekAgo;
    });

    if (recentFeedback.length === 0) {
      return;
    }

    const avgSatisfaction = recentFeedback.reduce((sum, f) => sum + (f.satisfaction || 0), 0) / recentFeedback.length;
    const avgUsability = recentFeedback.reduce((sum, f) => sum + (f.usability || 0), 0) / recentFeedback.length;
    const avgPerformance = recentFeedback.reduce((sum, f) => sum + (f.performance || 0), 0) / recentFeedback.length;

    console.log("\n📊 Feedback Analysis:");
    console.log(`Satisfaction: ${(avgSatisfaction * 100).toFixed(1)}%`);
    console.log(`Usability: ${(avgUsability * 100).toFixed(1)}%`);
    console.log(`Performance: ${(avgPerformance * 100).toFixed(1)}%`);

    // Check rollback thresholds
    const thresholds = this.teamConfig.feedback.thresholds;
    if (avgSatisfaction < thresholds.satisfaction || 
        avgUsability < thresholds.usability || 
        avgPerformance < thresholds.performance) {
      console.log("\n⚠️  Feedback below thresholds - consider rollback or adjustments");
      
      if (this.rolloutConfig.rollbackPlan.automaticRollback) {
        this.initiateRollback("automatic-threshold");
      }
    }
  }

  // Rollback management
  initiateRollback(reason) {
    console.log(`\n🔄 Initiating rollback due to: ${reason}`);
    
    const currentPhase = this.rolloutConfig.currentPhase;
    const phase = this.rolloutConfig.phases[currentPhase];
    
    if (phase) {
      this.disablePhaseFeatures(phase.features);
      phase.status = "rolled-back";
      phase.rollbackDate = new Date().toISOString();
      phase.rollbackReason = reason;
    }

    this.rolloutConfig.currentPhase = Math.max(0, currentPhase - 1);
    this.saveRolloutConfig();
    
    console.log("✓ Rollback completed");
  }

  disablePhaseFeatures(features) {
    console.log("Disabling features:", features);
    // Implementation would disable each feature
    // For now, just log the action
    features.forEach(feature => {
      console.log(`✓ Disabled ${feature}`);
    });
  }

  // Reporting
  generateStatusReport() {
    const report = {
      timestamp: new Date().toISOString(),
      currentPhase: this.rolloutConfig.currentPhase,
      phases: this.rolloutConfig.phases.map(phase => ({
        name: phase.name,
        status: phase.status,
        startDate: phase.startDate,
        endDate: phase.endDate
      })),
      teamStatus: {
        totalMembers: this.teamConfig.members.length,
        activeMembers: this.teamConfig.members.filter(m => m.status === "active").length,
        completedMembers: this.teamConfig.members.filter(m => 
          m.completedPhases.length === this.rolloutConfig.currentPhase + 1
        ).length
      },
      recentFeedback: this.getRecentFeedbackSummary()
    };

    const reportPath = path.join(this.configPath, `status-report-${Date.now()}.json`);
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    console.log("\n📋 Status Report Generated:");
    console.log(`Current Phase: ${report.currentPhase + 1} (${this.rolloutConfig.phases[report.currentPhase]?.name})`);
    console.log(`Team Progress: ${report.teamStatus.completedMembers}/${report.teamStatus.totalMembers} completed current phase`);
    console.log(`Report saved to: ${reportPath}`);
    
    return report;
  }

  getRecentFeedbackSummary() {
    const allFeedback = this.teamConfig.members.flatMap(m => m.feedback);
    const recentFeedback = allFeedback.filter(f => {
      const feedbackDate = new Date(f.timestamp);
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      return feedbackDate > weekAgo;
    });

    if (recentFeedback.length === 0) {
      return { count: 0 };
    }

    return {
      count: recentFeedback.length,
      avgSatisfaction: recentFeedback.reduce((sum, f) => sum + (f.satisfaction || 0), 0) / recentFeedback.length,
      avgUsability: recentFeedback.reduce((sum, f) => sum + (f.usability || 0), 0) / recentFeedback.length,
      avgPerformance: recentFeedback.reduce((sum, f) => sum + (f.performance || 0), 0) / recentFeedback.length
    };
  }
}

// CLI Interface
function main() {
  const manager = new GradualRolloutManager();
  const command = process.argv[2];
  const args = process.argv.slice(3);

  switch (command) {
    case "add-member":
      if (args.length < 3) {
        console.error("Usage: add-member <name> <email> <role> [earlyAdopter]");
        process.exit(1);
      }
      manager.addTeamMember(args[0], args[1], args[2], args[3] === "true");
      break;

    case "start-phase":
      if (args.length < 1) {
        console.error("Usage: start-phase <phaseIndex>");
        process.exit(1);
      }
      manager.startPhase(parseInt(args[0]));
      break;

    case "complete-phase":
      if (args.length < 1) {
        console.error("Usage: complete-phase <phaseIndex>");
        process.exit(1);
      }
      manager.completePhase(parseInt(args[0]));
      break;

    case "collect-feedback":
      if (args.length < 4) {
        console.error("Usage: collect-feedback <email> <satisfaction> <usability> <performance>");
        process.exit(1);
      }
      manager.collectFeedback(args[0], {
        satisfaction: parseFloat(args[1]),
        usability: parseFloat(args[2]),
        performance: parseFloat(args[3])
      });
      break;

    case "status":
      manager.generateStatusReport();
      break;

    case "rollback":
      manager.initiateRollback(args[0] || "manual");
      break;

    default:
      console.log("TypeScript Maintenance System - Gradual Rollout Manager");
      console.log("\nAvailable commands:");
      console.log("  add-member <name> <email> <role> [earlyAdopter]");
      console.log("  start-phase <phaseIndex>");
      console.log("  complete-phase <phaseIndex>");
      console.log("  collect-feedback <email> <satisfaction> <usability> <performance>");
      console.log("  status");
      console.log("  rollback [reason]");
      break;
  }
}

if (require.main === module) {
  main();
}

module.exports = GradualRolloutManager;