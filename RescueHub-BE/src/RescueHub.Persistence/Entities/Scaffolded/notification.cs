using System;
using System.Collections.Generic;

namespace RescueHub.Persistence.Entities.Scaffolded;

public partial class notification
{
    public Guid id { get; set; }

    public string type_code { get; set; } = null!;

    public string title { get; set; } = null!;

    public string content { get; set; } = null!;

    public string? target_entity_type_code { get; set; }

    public Guid? target_entity_id { get; set; }

    public DateTime created_at { get; set; }

    public virtual ICollection<user_notification> user_notifications { get; set; } = new List<user_notification>();
}
