using System;
using System.Collections.Generic;

namespace RescueHub.Persistence.Entities.Scaffolded;

public partial class app_user
{
    public Guid id { get; set; }

    public string username { get; set; } = null!;

    public string display_name { get; set; } = null!;

    public string? phone { get; set; }

    public string? email { get; set; }

    public string password_hash { get; set; } = null!;

    public string password_hash_algo { get; set; } = null!;

    public bool is_active { get; set; }

    public DateTime? last_login_at { get; set; }

    public DateTime created_at { get; set; }

    public DateTime updated_at { get; set; }

    public virtual ICollection<ai_job> ai_jobs { get; set; } = new List<ai_job>();

    public virtual ICollection<ai_suggestion> ai_suggestions { get; set; } = new List<ai_suggestion>();

    public virtual ICollection<app_user_role> app_user_roles { get; set; } = new List<app_user_role>();

    public virtual ICollection<audit_log> audit_logs { get; set; } = new List<audit_log>();

    public virtual ICollection<distribution> distributions { get; set; } = new List<distribution>();

    public virtual ICollection<incident_assessment> incident_assessments { get; set; } = new List<incident_assessment>();

    public virtual ICollection<incident_status_history> incident_status_histories { get; set; } = new List<incident_status_history>();

    public virtual ICollection<incident> incidents { get; set; } = new List<incident>();

    public virtual ICollection<mission_abort_request> mission_abort_requestdecided_by_users { get; set; } = new List<mission_abort_request>();

    public virtual ICollection<mission_abort_request> mission_abort_requestrequested_by_users { get; set; } = new List<mission_abort_request>();

    public virtual ICollection<mission_field_report> mission_field_reports { get; set; } = new List<mission_field_report>();

    public virtual ICollection<mission_status_history> mission_status_histories { get; set; } = new List<mission_status_history>();

    public virtual ICollection<mission_support_request> mission_support_requestdecided_by_users { get; set; } = new List<mission_support_request>();

    public virtual ICollection<mission_support_request> mission_support_requestrequested_by_users { get; set; } = new List<mission_support_request>();

    public virtual ICollection<mission> missions { get; set; } = new List<mission>();

    public virtual ICollection<relief_issue> relief_issues { get; set; } = new List<relief_issue>();

    public virtual ICollection<relief_point> relief_points { get; set; } = new List<relief_point>();

    public virtual ICollection<stock_transaction> stock_transactions { get; set; } = new List<stock_transaction>();

    public virtual ICollection<team_member> team_members { get; set; } = new List<team_member>();

    public virtual ICollection<team> teams { get; set; } = new List<team>();

    public virtual ICollection<user_notification> user_notifications { get; set; } = new List<user_notification>();

    public virtual ICollection<warehouse> warehouses { get; set; } = new List<warehouse>();
}
