package com.wavemaker.when_to_work.getAdditionalManagers.service;


import com.wavemaker.when_to_work.getAdditionalManagers.model.*;
import com.wavemaker.when_to_work.getAdditionalManagers.model.ResponseRootResponseROOTEntryItem;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.lang.Object;
import org.springframework.util.MultiValueMap;
import feign.*;

public interface GetAdditionalManagersService {

  /**
   * 
   * 
    * @param Authorization Authorization (optional)
   * @return List&lt;ResponseRootResponseROOTEntryItem&gt;
   */
  @RequestLine("GET /managers/additional-managers")
  @Headers({
    "Accept: application/json",
    "Authorization: {Authorization}"  })
  List<ResponseRootResponseROOTEntryItem> invoke(@Param("Authorization") String Authorization);

}
