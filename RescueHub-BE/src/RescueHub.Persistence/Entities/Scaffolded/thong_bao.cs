using System;
using System.Collections.Generic;

namespace RescueHub.Persistence.Entities.Scaffolded;

public partial class thong_bao
{
    public Guid id { get; set; }

    public string? event_type_code { get; set; }

    public string? entity_type { get; set; }

    public Guid? entity_id { get; set; }

    public string channel_code { get; set; } = null!;

    public string? subject { get; set; }

    public string? body { get; set; }

    public string status_code { get; set; } = null!;

    public DateTime? scheduled_at { get; set; }

    public DateTime? sent_at { get; set; }

    public DateTime created_at { get; set; }

    public virtual ICollection<nguoi_nhan_thong_bao> nguoi_nhan_thong_baos { get; set; } = new List<nguoi_nhan_thong_bao>();
}
