#!/usr/bin/env node

/**
 * TypeScript Maintenance System - Feedback Collector
 * 
 * This script collects, analyzes, and processes team feedback on the
 * TypeScript maintenance system to drive continuous improvement.
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

class FeedbackCollector {
  constructor() {
    this.configPath = path.join(__dirname, '..', '.typescript-maintenance');
    this.feedbackPath = path.join(this.configPath, 'feedback');
    this.reportsPath = path.join(this.configPath, 'reports');
    
    this.ensureDirectories();
    this.loadConfiguration();
  }

  ensureDirectories() {
    [this.configPath, this.feedbackPath, this.reportsPath].forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
  }

  loadConfiguration() {
    const configFile = path.join(this.configPath, 'feedback-config.json');
    
    if (fs.existsSync(configFile)) {
      this.config = JSON.parse(fs.readFileSync(configFile, 'utf8'));
    } else {
      this.config = this.getDefaultConfig();
      this.saveConfiguration();
    }
  }

  getDefaultConfig() {
    return {
      collection: {
        channels: ['cli', 'web', 'slack', 'email'],
        frequency: {
          daily: true,
          weekly: true,
          monthly: true,
          onDemand: true
        },
        categories: [
          'usability',
          'performance',
          'accuracy',
          'documentation',
          'integration',
          'training'
        ]
      },
      analysis: {
        sentimentAnalysis: true,
        trendAnalysis: true,
        prioritization: {
          critical: 0.9,
          high: 0.7,
          medium: 0.5,
          low: 0.3
        }
      },
      reporting: {
        autoGenerate: true,
        frequency: 'weekly',
        recipients: ['team-lead@company.com'],
        formats: ['json', 'html', 'summary']
      },
      improvement: {
        autoCreateIssues: true,
        priorityThreshold: 0.7,
        implementationTracking: true
      }
    };
  }

  saveConfiguration() {
    const configFile = path.join(this.configPath, 'feedback-config.json');
    fs.writeFileSync(configFile, JSON.stringify(this.config, null, 2));
  }

  // Interactive feedback collection
  async collectInteractiveFeedback() {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    const ask = (question) => new Promise(resolve => rl.question(question, resolve));

    try {
      console.log("🔍 TypeScript Maintenance System Feedback Collection\n");
      
      const feedback = {
        timestamp: new Date().toISOString(),
        type: 'interactive',
        respondent: {}
      };

      // Collect respondent information
      feedback.respondent.name = await ask("Your name: ");
      feedback.respondent.email = await ask("Your email: ");
      feedback.respondent.role = await ask("Your role (developer/senior-developer/team-lead): ");
      feedback.respondent.experience = await ask("Experience with TypeScript (beginner/intermediate/advanced): ");

      console.log("\n📊 Please rate the following aspects (1-5, where 5 is excellent):\n");

      // Collect ratings
      feedback.ratings = {};
      const aspects = [
        { key: 'usability', label: 'Overall usability and ease of use' },
        { key: 'performance', label: 'System performance and speed' },
        { key: 'accuracy', label: 'Error detection accuracy' },
        { key: 'integration', label: 'Integration with existing workflow' },
        { key: 'documentation', label: 'Documentation quality and completeness' },
        { key: 'training', label: 'Training materials and support' }
      ];

      for (const aspect of aspects) {
        let rating;
        do {
          rating = parseInt(await ask(`${aspect.label} (1-5): `));
        } while (isNaN(rating) || rating < 1 || rating > 5);
        
        feedback.ratings[aspect.key] = rating;
      }

      console.log("\n💭 Additional feedback:\n");

      // Collect qualitative feedback
      feedback.comments = {};
      feedback.comments.likes = await ask("What do you like most about the system? ");
      feedback.comments.dislikes = await ask("What do you like least about the system? ");
      feedback.comments.improvements = await ask("What improvements would you suggest? ");
      feedback.comments.issues = await ask("Any specific issues or bugs encountered? ");
      feedback.comments.additional = await ask("Any additional comments? ");

      // Collect usage patterns
      console.log("\n⚙️ Usage patterns:\n");
      feedback.usage = {};
      feedback.usage.frequency = await ask("How often do you interact with the system? (daily/weekly/occasionally): ");
      feedback.usage.features = await ask("Which features do you use most? ");
      feedback.usage.timeSpent = await ask("How much time does the system save/cost you daily? (in minutes): ");

      // Save feedback
      await this.saveFeedback(feedback);
      
      console.log("\n✅ Thank you for your feedback! It has been recorded and will be analyzed.");
      
      // Generate immediate insights
      this.generateImmediateInsights(feedback);

    } finally {
      rl.close();
    }
  }

  // Programmatic feedback collection
  async collectProgrammaticFeedback(feedbackData) {
    const feedback = {
      timestamp: new Date().toISOString(),
      type: 'programmatic',
      ...feedbackData
    };

    await this.saveFeedback(feedback);
    return feedback;
  }

  // Save feedback to file system
  async saveFeedback(feedback) {
    const filename = `feedback-${Date.now()}-${Math.random().toString(36).substr(2, 9)}.json`;
    const filepath = path.join(this.feedbackPath, filename);
    
    fs.writeFileSync(filepath, JSON.stringify(feedback, null, 2));
    
    console.log(`Feedback saved: ${filename}`);
    
    // Trigger analysis if auto-analysis is enabled
    if (this.config.analysis.autoAnalyze) {
      await this.analyzeFeedback();
    }
  }

  // Load all feedback
  loadAllFeedback() {
    const feedbackFiles = fs.readdirSync(this.feedbackPath)
      .filter(file => file.endsWith('.json'))
      .map(file => {
        const filepath = path.join(this.feedbackPath, file);
        return JSON.parse(fs.readFileSync(filepath, 'utf8'));
      });

    return feedbackFiles.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  }

  // Analyze feedback
  async analyzeFeedback(timeframe = '30d') {
    console.log("📈 Analyzing feedback...");
    
    const allFeedback = this.loadAllFeedback();
    const cutoffDate = this.getCutoffDate(timeframe);
    const recentFeedback = allFeedback.filter(f => new Date(f.timestamp) > cutoffDate);

    if (recentFeedback.length === 0) {
      console.log("No feedback found for the specified timeframe.");
      return;
    }

    const analysis = {
      timestamp: new Date().toISOString(),
      timeframe,
      totalResponses: recentFeedback.length,
      demographics: this.analyzeDemographics(recentFeedback),
      ratings: this.analyzeRatings(recentFeedback),
      sentiment: this.analyzeSentiment(recentFeedback),
      trends: this.analyzeTrends(recentFeedback),
      issues: this.identifyIssues(recentFeedback),
      recommendations: this.generateRecommendations(recentFeedback)
    };

    // Save analysis
    const analysisFile = path.join(this.reportsPath, `analysis-${Date.now()}.json`);
    fs.writeFileSync(analysisFile, JSON.stringify(analysis, null, 2));

    console.log(`Analysis completed and saved: ${analysisFile}`);
    
    // Generate reports
    await this.generateReports(analysis);
    
    return analysis;
  }

  analyzeDemographics(feedback) {
    const demographics = {
      roles: {},
      experience: {},
      totalRespondents: feedback.length
    };

    feedback.forEach(f => {
      if (f.respondent?.role) {
        demographics.roles[f.respondent.role] = (demographics.roles[f.respondent.role] || 0) + 1;
      }
      
      if (f.respondent?.experience) {
        demographics.experience[f.respondent.experience] = (demographics.experience[f.respondent.experience] || 0) + 1;
      }
    });

    return demographics;
  }

  analyzeRatings(feedback) {
    const ratingsData = feedback.filter(f => f.ratings);
    
    if (ratingsData.length === 0) {
      return { message: "No rating data available" };
    }

    const aspects = ['usability', 'performance', 'accuracy', 'integration', 'documentation', 'training'];
    const analysis = {};

    aspects.forEach(aspect => {
      const ratings = ratingsData
        .map(f => f.ratings[aspect])
        .filter(r => r !== undefined);

      if (ratings.length > 0) {
        analysis[aspect] = {
          average: ratings.reduce((sum, r) => sum + r, 0) / ratings.length,
          count: ratings.length,
          distribution: this.getRatingDistribution(ratings),
          trend: this.calculateTrend(ratingsData, aspect)
        };
      }
    });

    // Overall satisfaction
    const allRatings = ratingsData.flatMap(f => Object.values(f.ratings || {}));
    analysis.overall = {
      average: allRatings.reduce((sum, r) => sum + r, 0) / allRatings.length,
      satisfaction: this.calculateSatisfactionLevel(allRatings)
    };

    return analysis;
  }

  analyzeSentiment(feedback) {
    const comments = feedback.flatMap(f => [
      f.comments?.likes,
      f.comments?.dislikes,
      f.comments?.improvements,
      f.comments?.additional
    ].filter(Boolean));

    if (comments.length === 0) {
      return { message: "No comment data available" };
    }

    // Simple sentiment analysis based on keywords
    const positiveKeywords = ['good', 'great', 'excellent', 'love', 'helpful', 'easy', 'fast', 'useful'];
    const negativeKeywords = ['bad', 'terrible', 'hate', 'slow', 'difficult', 'confusing', 'broken', 'annoying'];

    let positiveScore = 0;
    let negativeScore = 0;

    comments.forEach(comment => {
      const lowerComment = comment.toLowerCase();
      
      positiveKeywords.forEach(keyword => {
        if (lowerComment.includes(keyword)) positiveScore++;
      });
      
      negativeKeywords.forEach(keyword => {
        if (lowerComment.includes(keyword)) negativeScore++;
      });
    });

    const totalScore = positiveScore + negativeScore;
    const sentiment = totalScore === 0 ? 'neutral' : 
      positiveScore > negativeScore ? 'positive' : 'negative';

    return {
      sentiment,
      positiveScore,
      negativeScore,
      confidence: totalScore > 0 ? Math.abs(positiveScore - negativeScore) / totalScore : 0,
      commonThemes: this.extractCommonThemes(comments)
    };
  }

  analyzeTrends(feedback) {
    // Group feedback by week
    const weeklyData = {};
    
    feedback.forEach(f => {
      const week = this.getWeekKey(new Date(f.timestamp));
      if (!weeklyData[week]) {
        weeklyData[week] = [];
      }
      weeklyData[week].push(f);
    });

    const trends = {
      responseVolume: this.calculateResponseVolumeTrend(weeklyData),
      satisfactionTrend: this.calculateSatisfactionTrend(weeklyData),
      issuesTrend: this.calculateIssuesTrend(weeklyData)
    };

    return trends;
  }

  identifyIssues(feedback) {
    const issues = [];
    
    // Identify issues from ratings
    feedback.forEach(f => {
      if (f.ratings) {
        Object.entries(f.ratings).forEach(([aspect, rating]) => {
          if (rating <= 2) {
            issues.push({
              type: 'low-rating',
              aspect,
              rating,
              respondent: f.respondent?.name || 'Anonymous',
              timestamp: f.timestamp,
              severity: rating === 1 ? 'critical' : 'high'
            });
          }
        });
      }
    });

    // Identify issues from comments
    feedback.forEach(f => {
      if (f.comments?.issues && f.comments.issues.trim()) {
        issues.push({
          type: 'reported-issue',
          description: f.comments.issues,
          respondent: f.respondent?.name || 'Anonymous',
          timestamp: f.timestamp,
          severity: this.assessIssueSeverity(f.comments.issues)
        });
      }
    });

    // Group and prioritize issues
    const groupedIssues = this.groupIssues(issues);
    const prioritizedIssues = this.prioritizeIssues(groupedIssues);

    return {
      total: issues.length,
      byType: this.groupBy(issues, 'type'),
      bySeverity: this.groupBy(issues, 'severity'),
      prioritized: prioritizedIssues
    };
  }

  generateRecommendations(feedback) {
    const recommendations = [];
    const analysis = {
      ratings: this.analyzeRatings(feedback),
      sentiment: this.analyzeSentiment(feedback),
      issues: this.identifyIssues(feedback)
    };

    // Rating-based recommendations
    if (analysis.ratings.overall?.average < 3.5) {
      recommendations.push({
        priority: 'high',
        category: 'overall-satisfaction',
        title: 'Improve Overall System Satisfaction',
        description: 'Overall satisfaction is below acceptable levels. Focus on addressing top pain points.',
        actions: ['Conduct detailed user interviews', 'Prioritize critical issues', 'Implement quick wins']
      });
    }

    // Aspect-specific recommendations
    Object.entries(analysis.ratings).forEach(([aspect, data]) => {
      if (data.average && data.average < 3.0) {
        recommendations.push({
          priority: 'high',
          category: aspect,
          title: `Improve ${aspect.charAt(0).toUpperCase() + aspect.slice(1)}`,
          description: `${aspect} ratings are below acceptable levels (${data.average.toFixed(1)}/5)`,
          actions: this.getAspectSpecificActions(aspect)
        });
      }
    });

    // Issue-based recommendations
    if (analysis.issues.total > 0) {
      analysis.issues.prioritized.slice(0, 3).forEach(issue => {
        recommendations.push({
          priority: issue.severity,
          category: 'issue-resolution',
          title: `Address ${issue.type} Issues`,
          description: issue.description || `Multiple ${issue.type} issues reported`,
          actions: ['Investigate root cause', 'Implement fix', 'Validate with users']
        });
      });
    }

    // Sentiment-based recommendations
    if (analysis.sentiment.sentiment === 'negative') {
      recommendations.push({
        priority: 'medium',
        category: 'user-experience',
        title: 'Improve User Experience',
        description: 'Negative sentiment detected in user comments',
        actions: ['Review common complaints', 'Improve documentation', 'Enhance training materials']
      });
    }

    return recommendations.sort((a, b) => {
      const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }

  // Generate reports
  async generateReports(analysis) {
    console.log("📄 Generating reports...");

    // JSON Report
    const jsonReport = {
      ...analysis,
      generatedAt: new Date().toISOString(),
      reportType: 'comprehensive'
    };

    const jsonReportPath = path.join(this.reportsPath, `report-${Date.now()}.json`);
    fs.writeFileSync(jsonReportPath, JSON.stringify(jsonReport, null, 2));

    // HTML Report
    const htmlReport = this.generateHTMLReport(analysis);
    const htmlReportPath = path.join(this.reportsPath, `report-${Date.now()}.html`);
    fs.writeFileSync(htmlReportPath, htmlReport);

    // Summary Report
    const summaryReport = this.generateSummaryReport(analysis);
    const summaryReportPath = path.join(this.reportsPath, `summary-${Date.now()}.md`);
    fs.writeFileSync(summaryReportPath, summaryReport);

    console.log(`Reports generated:`);
    console.log(`  JSON: ${jsonReportPath}`);
    console.log(`  HTML: ${htmlReportPath}`);
    console.log(`  Summary: ${summaryReportPath}`);
  }

  generateHTMLReport(analysis) {
    return `<!DOCTYPE html>
<html>
<head>
    <title>TypeScript Maintenance System - Feedback Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        .header { background: #f5f5f5; padding: 20px; border-radius: 5px; }
        .section { margin: 20px 0; }
        .metric { display: inline-block; margin: 10px; padding: 15px; background: #e9f4ff; border-radius: 5px; }
        .recommendation { background: #fff3cd; padding: 15px; margin: 10px 0; border-radius: 5px; }
        .high-priority { border-left: 5px solid #dc3545; }
        .medium-priority { border-left: 5px solid #ffc107; }
        .low-priority { border-left: 5px solid #28a745; }
    </style>
</head>
<body>
    <div class="header">
        <h1>TypeScript Maintenance System - Feedback Report</h1>
        <p>Generated: ${new Date().toLocaleString()}</p>
        <p>Timeframe: ${analysis.timeframe} | Responses: ${analysis.totalResponses}</p>
    </div>

    <div class="section">
        <h2>Overall Satisfaction</h2>
        <div class="metric">
            <strong>Average Rating:</strong> ${analysis.ratings.overall?.average?.toFixed(1) || 'N/A'}/5
        </div>
        <div class="metric">
            <strong>Satisfaction Level:</strong> ${analysis.ratings.overall?.satisfaction || 'N/A'}
        </div>
    </div>

    <div class="section">
        <h2>Key Metrics</h2>
        ${Object.entries(analysis.ratings).filter(([key]) => key !== 'overall').map(([aspect, data]) => `
            <div class="metric">
                <strong>${aspect.charAt(0).toUpperCase() + aspect.slice(1)}:</strong> ${data.average?.toFixed(1) || 'N/A'}/5
            </div>
        `).join('')}
    </div>

    <div class="section">
        <h2>Issues Summary</h2>
        <div class="metric">
            <strong>Total Issues:</strong> ${analysis.issues.total}
        </div>
        <div class="metric">
            <strong>Critical:</strong> ${analysis.issues.bySeverity?.critical?.length || 0}
        </div>
        <div class="metric">
            <strong>High:</strong> ${analysis.issues.bySeverity?.high?.length || 0}
        </div>
    </div>

    <div class="section">
        <h2>Recommendations</h2>
        ${analysis.recommendations.map(rec => `
            <div class="recommendation ${rec.priority}-priority">
                <h3>${rec.title}</h3>
                <p>${rec.description}</p>
                <ul>
                    ${rec.actions.map(action => `<li>${action}</li>`).join('')}
                </ul>
            </div>
        `).join('')}
    </div>
</body>
</html>`;
  }

  generateSummaryReport(analysis) {
    return `# TypeScript Maintenance System - Feedback Summary

**Generated:** ${new Date().toLocaleString()}  
**Timeframe:** ${analysis.timeframe}  
**Total Responses:** ${analysis.totalResponses}

## Key Findings

### Overall Satisfaction
- **Average Rating:** ${analysis.ratings.overall?.average?.toFixed(1) || 'N/A'}/5
- **Satisfaction Level:** ${analysis.ratings.overall?.satisfaction || 'N/A'}

### Aspect Ratings
${Object.entries(analysis.ratings).filter(([key]) => key !== 'overall').map(([aspect, data]) => 
  `- **${aspect.charAt(0).toUpperCase() + aspect.slice(1)}:** ${data.average?.toFixed(1) || 'N/A'}/5`
).join('\n')}

### Issues
- **Total Issues:** ${analysis.issues.total}
- **Critical:** ${analysis.issues.bySeverity?.critical?.length || 0}
- **High Priority:** ${analysis.issues.bySeverity?.high?.length || 0}

### Sentiment Analysis
- **Overall Sentiment:** ${analysis.sentiment.sentiment}
- **Confidence:** ${(analysis.sentiment.confidence * 100).toFixed(1)}%

## Top Recommendations

${analysis.recommendations.slice(0, 5).map((rec, index) => `
${index + 1}. **${rec.title}** (${rec.priority} priority)
   - ${rec.description}
   - Actions: ${rec.actions.join(', ')}
`).join('')}

## Next Steps

1. Review and prioritize recommendations
2. Create action items for high-priority issues
3. Schedule follow-up feedback collection
4. Communicate improvements to team

---
*This report was automatically generated by the TypeScript Maintenance System Feedback Collector*`;
  }

  generateImmediateInsights(feedback) {
    console.log("\n🔍 Immediate Insights:");
    
    if (feedback.ratings) {
      const avgRating = Object.values(feedback.ratings).reduce((sum, r) => sum + r, 0) / Object.values(feedback.ratings).length;
      console.log(`   Overall Rating: ${avgRating.toFixed(1)}/5`);
      
      const lowRatings = Object.entries(feedback.ratings).filter(([_, rating]) => rating <= 2);
      if (lowRatings.length > 0) {
        console.log(`   ⚠️  Low ratings in: ${lowRatings.map(([aspect]) => aspect).join(', ')}`);
      }
    }

    if (feedback.comments?.issues && feedback.comments.issues.trim()) {
      console.log(`   🐛 Issue reported: ${feedback.comments.issues.substring(0, 100)}...`);
    }

    if (feedback.comments?.improvements && feedback.comments.improvements.trim()) {
      console.log(`   💡 Improvement suggested: ${feedback.comments.improvements.substring(0, 100)}...`);
    }
  }

  // Helper methods
  getCutoffDate(timeframe) {
    const now = new Date();
    const days = parseInt(timeframe.replace('d', ''));
    return new Date(now.getTime() - (days * 24 * 60 * 60 * 1000));
  }

  getRatingDistribution(ratings) {
    const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    ratings.forEach(rating => distribution[rating]++);
    return distribution;
  }

  calculateTrend(ratingsData, aspect) {
    // Simple trend calculation - compare first half vs second half
    const sortedData = ratingsData.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    const midpoint = Math.floor(sortedData.length / 2);
    
    const firstHalf = sortedData.slice(0, midpoint).map(f => f.ratings[aspect]).filter(r => r !== undefined);
    const secondHalf = sortedData.slice(midpoint).map(f => f.ratings[aspect]).filter(r => r !== undefined);
    
    if (firstHalf.length === 0 || secondHalf.length === 0) return 'stable';
    
    const firstAvg = firstHalf.reduce((sum, r) => sum + r, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, r) => sum + r, 0) / secondHalf.length;
    
    const diff = secondAvg - firstAvg;
    if (diff > 0.3) return 'improving';
    if (diff < -0.3) return 'declining';
    return 'stable';
  }

  calculateSatisfactionLevel(ratings) {
    const avg = ratings.reduce((sum, r) => sum + r, 0) / ratings.length;
    if (avg >= 4.5) return 'excellent';
    if (avg >= 4.0) return 'good';
    if (avg >= 3.0) return 'acceptable';
    if (avg >= 2.0) return 'poor';
    return 'critical';
  }

  extractCommonThemes(comments) {
    // Simple keyword extraction
    const words = comments.join(' ').toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 3);
    
    const wordCount = {};
    words.forEach(word => wordCount[word] = (wordCount[word] || 0) + 1);
    
    return Object.entries(wordCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([word, count]) => ({ word, count }));
  }

  getWeekKey(date) {
    const year = date.getFullYear();
    const week = Math.ceil((date.getTime() - new Date(year, 0, 1).getTime()) / (7 * 24 * 60 * 60 * 1000));
    return `${year}-W${week}`;
  }

  calculateResponseVolumeTrend(weeklyData) {
    const weeks = Object.keys(weeklyData).sort();
    return weeks.map(week => ({
      week,
      count: weeklyData[week].length
    }));
  }

  calculateSatisfactionTrend(weeklyData) {
    const weeks = Object.keys(weeklyData).sort();
    return weeks.map(week => {
      const weekFeedback = weeklyData[week];
      const ratings = weekFeedback.flatMap(f => Object.values(f.ratings || {}));
      const avg = ratings.length > 0 ? ratings.reduce((sum, r) => sum + r, 0) / ratings.length : null;
      return { week, satisfaction: avg };
    });
  }

  calculateIssuesTrend(weeklyData) {
    const weeks = Object.keys(weeklyData).sort();
    return weeks.map(week => {
      const weekFeedback = weeklyData[week];
      const issueCount = weekFeedback.filter(f => 
        (f.comments?.issues && f.comments.issues.trim()) ||
        Object.values(f.ratings || {}).some(r => r <= 2)
      ).length;
      return { week, issues: issueCount };
    });
  }

  assessIssueSeverity(issueDescription) {
    const criticalKeywords = ['crash', 'broken', 'unusable', 'critical', 'urgent'];
    const highKeywords = ['slow', 'error', 'bug', 'problem', 'issue'];
    
    const lowerDescription = issueDescription.toLowerCase();
    
    if (criticalKeywords.some(keyword => lowerDescription.includes(keyword))) {
      return 'critical';
    }
    
    if (highKeywords.some(keyword => lowerDescription.includes(keyword))) {
      return 'high';
    }
    
    return 'medium';
  }

  groupIssues(issues) {
    const grouped = {};
    
    issues.forEach(issue => {
      const key = issue.aspect || issue.type;
      if (!grouped[key]) {
        grouped[key] = [];
      }
      grouped[key].push(issue);
    });
    
    return grouped;
  }

  prioritizeIssues(groupedIssues) {
    const prioritized = [];
    
    Object.entries(groupedIssues).forEach(([key, issues]) => {
      const severityScore = issues.reduce((score, issue) => {
        const severityValues = { critical: 4, high: 3, medium: 2, low: 1 };
        return score + (severityValues[issue.severity] || 1);
      }, 0);
      
      prioritized.push({
        type: key,
        count: issues.length,
        severityScore,
        severity: this.getOverallSeverity(issues),
        issues
      });
    });
    
    return prioritized.sort((a, b) => b.severityScore - a.severityScore);
  }

  getOverallSeverity(issues) {
    if (issues.some(i => i.severity === 'critical')) return 'critical';
    if (issues.some(i => i.severity === 'high')) return 'high';
    if (issues.some(i => i.severity === 'medium')) return 'medium';
    return 'low';
  }

  getAspectSpecificActions(aspect) {
    const actions = {
      usability: ['Conduct usability testing', 'Simplify user interface', 'Improve user flows'],
      performance: ['Profile system performance', 'Optimize slow operations', 'Implement caching'],
      accuracy: ['Review error detection algorithms', 'Improve validation rules', 'Add more test cases'],
      integration: ['Review integration points', 'Improve compatibility', 'Update documentation'],
      documentation: ['Update user guides', 'Add more examples', 'Create video tutorials'],
      training: ['Improve training materials', 'Add hands-on exercises', 'Provide more support']
    };
    
    return actions[aspect] || ['Investigate specific issues', 'Gather more feedback', 'Implement improvements'];
  }

  groupBy(array, key) {
    return array.reduce((groups, item) => {
      const group = item[key];
      if (!groups[group]) {
        groups[group] = [];
      }
      groups[group].push(item);
      return groups;
    }, {});
  }
}

// CLI Interface
function main() {
  const collector = new FeedbackCollector();
  const command = process.argv[2];
  const args = process.argv.slice(3);

  switch (command) {
    case "collect":
      collector.collectInteractiveFeedback().catch(error => {
        console.error("Feedback collection failed:", error.message);
        process.exit(1);
      });
      break;

    case "analyze":
      const timeframe = args[0] || '30d';
      collector.analyzeFeedback(timeframe).catch(error => {
        console.error("Analysis failed:", error.message);
        process.exit(1);
      });
      break;

    case "submit":
      if (args.length < 1) {
        console.error("Usage: submit <feedback-json>");
        process.exit(1);
      }
      
      try {
        const feedbackData = JSON.parse(args[0]);
        collector.collectProgrammaticFeedback(feedbackData);
      } catch (error) {
        console.error("Invalid feedback JSON:", error.message);
        process.exit(1);
      }
      break;

    default:
      console.log("TypeScript Maintenance System - Feedback Collector");
      console.log("\nAvailable commands:");
      console.log("  collect                    - Start interactive feedback collection");
      console.log("  analyze [timeframe]        - Analyze feedback (default: 30d)");
      console.log("  submit <feedback-json>     - Submit programmatic feedback");
      break;
  }
}

if (require.main === module) {
  main();
}

module.exports = FeedbackCollector;