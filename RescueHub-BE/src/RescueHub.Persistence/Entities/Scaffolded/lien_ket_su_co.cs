using System;
using System.Collections.Generic;

namespace RescueHub.Persistence.Entities.Scaffolded;

public partial class lien_ket_su_co
{
    public Guid id { get; set; }

    public Guid source_su_co_id { get; set; }

    public Guid target_su_co_id { get; set; }

    public string link_type_code { get; set; } = null!;

    public decimal? confidence_score { get; set; }

    public Guid? linked_by { get; set; }

    public DateTime linked_at { get; set; }

    public virtual nguoi_dung? linked_byNavigation { get; set; }

    public virtual su_co source_su_co { get; set; } = null!;

    public virtual su_co target_su_co { get; set; } = null!;
}
